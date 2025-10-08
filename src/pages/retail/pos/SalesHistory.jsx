// FILE: src/pages/retail/pos/SalesHistory.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getItem } from '../../../state/storage';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { Search, Eye, Calendar } from 'react-bootstrap-icons';

const SalesHistory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('Todas');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Busca dados reais do localStorage
  const allSales = getItem('sales') || [];
  const allProducts = getItem('products') || [];
  const allClients = getItem('clients') || [];
  const inventory = getItem('inventory') || [];

  // Filtra vendas do varejista atual
  const retailerSales = useMemo(() => {
    if (!user || !user.actorId) {
      return [];
    }
    
    const filtered = allSales
      .filter(sale => sale.retailerId === user.actorId)
      .map(sale => {
        // Determina origem baseado na forma de pagamento
        let origin = 'PDV';
        if (sale.formaPagamento === 'Upload de Planilha') {
          origin = 'IMPORTADA';
        } else if (sale.formaPagamento === 'Anota Aí') {
          origin = 'ANOTA AÍ';
        }

        // Calcula totais CORRETAMENTE
        const totalItems = sale.itens.reduce((sum, item) => sum + item.qtde, 0);
        
        // Usa os valores já calculados na venda
        const totalBruto = sale.totalBruto;
        const desconto = sale.desconto || 0;
        const totalLiquido = sale.totalLiquido;
        
        // Calcula o CUSTO total da venda (busca custo médio no inventário)
        let totalCost = 0;
        sale.itens.forEach(item => {
          const invItem = inventory.find(i => 
            i.productId === item.productId && 
            i.retailerId === user.actorId
          );
          if (invItem && invItem.custoMedio) {
            totalCost += invItem.custoMedio * item.qtde;
          }
        });
        
        // Calcula LUCRO e % de LUCRO
        const profit = totalLiquido - totalCost;
        const profitPercentage = totalLiquido > 0 
          ? ((profit / totalLiquido) * 100).toFixed(1)
          : 0;

        return {
          ...sale,
          origin,
          totalItems,
          totalBruto,
          desconto,
          totalLiquido,
          totalCost,
          profit,
          profitPercentage,
          formattedDate: new Date(sale.dataISO).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      })
      .sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
    
    return filtered;
  }, [user, allSales, inventory]);

  // Aplica filtros
  const filteredSales = useMemo(() => {
    return retailerSales.filter(sale => {
      const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.formaPagamento.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOrigin = originFilter === 'Todas' || sale.origin === originFilter;
      
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const saleDate = new Date(sale.dataISO);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = saleDate >= startDate && saleDate <= endDate;
      }
      
      return matchesSearch && matchesOrigin && matchesDate;
    });
  }, [retailerSales, searchTerm, originFilter, dateRange]);

  // Calcula estatísticas CORRETAMENTE
  const totalStats = useMemo(() => {
    return filteredSales.reduce((acc, sale) => ({
      count: acc.count + 1,
      gross: acc.gross + sale.totalBruto,
      discount: acc.discount + sale.desconto,
      net: acc.net + sale.totalLiquido,
      items: acc.items + sale.totalItems,
      profit: acc.profit + sale.profit
    }), { count: 0, gross: 0, discount: 0, net: 0, items: 0, profit: 0 });
  }, [filteredSales]);

  // Prepara detalhes da venda selecionada
  const saleDetails = useMemo(() => {
    if (!selectedSale) return null;

    const client = allClients.find(c => c.id === selectedSale.clienteId);
    const items = selectedSale.itens.map(item => {
      const product = allProducts.find(p => p.id === item.productId);
      const invItem = inventory.find(i => i.productId === item.productId && i.retailerId === user?.actorId);
      
      return {
        ...item,
        productName: product?.nome || invItem?.nome || 'Produto Desconhecido',
        subtotal: item.qtde * item.precoUnit
      };
    });

    return {
      ...selectedSale,
      clientName: client?.nome || 'Cliente não identificado',
      items
    };
  }, [selectedSale, allClients, allProducts, inventory, user]);

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">Histórico de Vendas</h2>
          <p className="text-muted">Visualize e gerencie todas as suas vendas registradas</p>
        </Col>
      </Row>

      {/* Cards de Resumo */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total de Vendas</p>
                  <h4 className="mb-0">{totalStats.count}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-cart-check fs-4 text-primary"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Receita Bruta</p>
                  <h4 className="mb-0">R$ {totalStats.gross.toFixed(2)}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-currency-dollar fs-4 text-success"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Receita Líquida</p>
                  <h4 className="mb-0 text-success">R$ {totalStats.net.toFixed(2)}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-cash-stack fs-4 text-success"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Lucro Total</p>
                  <h4 className="mb-0 text-primary">R$ {totalStats.profit.toFixed(2)}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-piggy-bank fs-4 text-primary"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text><Search size={18} /></InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por ID ou pagamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={originFilter} 
                onChange={(e) => setOriginFilter(e.target.value)}
              >
                <option value="Todas">Todas as origens</option>
                <option value="PDV">PDV Tradicional</option>
                <option value="ANOTA AÍ">Anota Aí</option>
                <option value="IMPORTADA">Importada</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text><Calendar size={18} /></InputGroup.Text>
                <Form.Control
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>até</InputGroup.Text>
                <Form.Control
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 px-4">Data/Hora</th>
                  <th className="border-0 py-3">Código</th>
                  <th className="border-0 py-3">Origem</th>
                  <th className="border-0 py-3 text-center">Itens</th>
                  <th className="border-0 py-3 text-end">Valor Total</th>
                  <th className="border-0 py-3 text-end">% Lucro</th>
                  <th className="border-0 py-3 text-end">Valor Lucro</th>
                  <th className="border-0 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 align-middle">
                      <small>{sale.formattedDate}</small>
                    </td>
                    <td className="align-middle">
                      <code className="text-muted small">{sale.id.slice(0, 10)}...</code>
                    </td>
                    <td className="align-middle">
                      <Badge 
                        bg={
                          sale.origin === 'PDV' ? 'primary' : 
                          sale.origin === 'ANOTA AÍ' ? 'success' : 
                          'info'
                        }
                        className="px-3 py-2"
                      >
                        {sale.origin}
                      </Badge>
                    </td>
                    <td className="align-middle text-center">
                      <strong>{sale.totalItems}</strong>
                    </td>
                    <td className="align-middle text-end">
                      <strong>R$ {sale.totalLiquido.toFixed(2)}</strong>
                    </td>
                    <td className="align-middle text-end">
                      <Badge 
                        bg={sale.profitPercentage >= 20 ? 'success' : sale.profitPercentage >= 10 ? 'warning' : 'danger'}
                        className="px-2 py-1"
                      >
                        {sale.profitPercentage}%
                      </Badge>
                    </td>
                    <td className="align-middle text-end">
                      <strong className={sale.profit > 0 ? 'text-success' : 'text-danger'}>
                        R$ {sale.profit.toFixed(2)}
                      </strong>
                    </td>
                    <td className="align-middle text-center">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-box-seam display-1 text-muted mb-3"></i>
              <p className="text-muted">
                {retailerSales.length === 0 
                  ? 'Comece registrando sua primeira venda!' 
                  : 'Nenhuma venda encontrada com os filtros aplicados'}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Detalhes */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <div>
              Detalhes da Venda
              <div className="small opacity-75 mt-1">
                ID: {saleDetails?.id.slice(0, 16)}...
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saleDetails && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-light border-0 mb-3">
                    <Card.Body className="py-2">
                      <small className="text-muted d-block">Data e Hora</small>
                      <strong>{saleDetails.formattedDate}</strong>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light border-0 mb-3">
                    <Card.Body className="py-2">
                      <small className="text-muted d-block">Cliente</small>
                      <strong>{saleDetails.clientName}</strong>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light border-0 mb-3">
                    <Card.Body className="py-2">
                      <small className="text-muted d-block">Forma de Pagamento</small>
                      <strong>{saleDetails.formaPagamento}</strong>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light border-0 mb-3">
                    <Card.Body className="py-2">
                      <small className="text-muted d-block">Origem</small>
                      <Badge 
                        bg={
                          saleDetails.origin === 'PDV' ? 'primary' : 
                          saleDetails.origin === 'ANOTA AÍ' ? 'success' : 
                          'info'
                        }
                        className="px-3 py-2"
                      >
                        {saleDetails.origin}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="bg-primary bg-opacity-10 border-primary mb-4">
                <Card.Body>
                  <h6 className="mb-3">
                    <i className="bi bi-currency-dollar me-2"></i>
                    Resumo Financeiro
                  </h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Valor Bruto:</span>
                    <strong>R$ {saleDetails.totalBruto.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Desconto:</span>
                    <strong className="text-danger">- R$ {saleDetails.desconto.toFixed(2)}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Valor Líquido:</strong>
                    <h5 className="text-success mb-0">R$ {saleDetails.totalLiquido.toFixed(2)}</h5>
                  </div>
                </Card.Body>
              </Card>

              <h6 className="mb-3">
                <i className="bi bi-box-seam me-2"></i>
                Itens da Venda ({saleDetails.items.length})
              </h6>
              <Table bordered size="sm">
                <thead className="bg-light">
                  <tr>
                    <th>Produto</th>
                    <th className="text-center" style={{width: '80px'}}>Qtd</th>
                    <th className="text-end" style={{width: '120px'}}>Preço Unit.</th>
                    <th className="text-end" style={{width: '120px'}}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {saleDetails.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td className="text-center"><strong>{item.qtde}</strong></td>
                      <td className="text-end">R$ {item.precoUnit.toFixed(2)}</td>
                      <td className="text-end"><strong>R$ {item.subtotal.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td className="text-end">
                      <strong className="text-success">
                        R$ {saleDetails.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SalesHistory;