// FILE: src/pages/retail/pos/SalesHistory.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getItem, setItem } from '../../../state/storage';
import { 
    Container, Row, Col, Card, Table, Button, Form, 
    Badge, Modal, Alert, ButtonGroup, InputGroup 
} from 'react-bootstrap';
import { 
    Calendar, Search, FileArrowDown, Eye,
    FunnelFill, XCircle, Trash, CheckSquare, Square
} from 'react-bootstrap-icons';

const SalesHistory = () => {
    const { user } = useAuth();
    const [sales, setSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSales, setSelectedSales] = useState(new Set());
    
    // Filtros
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        source: 'all',
        searchTerm: '',
        minValue: '',
        maxValue: ''
    });

    useEffect(() => {
        if (user) {
            loadSales();
        }
    }, [user]);

    const loadSales = () => {
        try {
            const allSales = getItem('sales') || [];
            const retailerSales = allSales
                .filter(sale => sale.retailerId === user.actorId)
                .map(sale => transformSaleData(sale))
                .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
            
            setSales(retailerSales);
            setSelectedSales(new Set()); // Limpa seleções ao recarregar
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
        }
    };

    const transformSaleData = (sale) => {
        const products = getItem('products') || [];

        const totalItens = sale.itens.reduce((sum, item) => sum + item.qtde, 0);
        const valorTotal = sale.totalLiquido || 0;
        const custoTotal = sale.itens.reduce((sum, item) => 
            sum + (item.qtde * (item.precoCusto || item.precoUnit * 0.7)), 0
        );
        const lucroBruto = valorTotal - custoTotal;
        const margemLucroPercentual = custoTotal > 0 ? (lucroBruto / custoTotal) * 100 : 0;

        return {
            id: sale.id,
            dataHora: sale.dataISO,
            origem: sale.formaPagamento === 'Upload de Planilha' ? 'IMPORTADA' : 'NATIVA',
            totalItens,
            valorTotal,
            custoTotal,
            lucroBruto,
            margemLucroPercentual,
            formaPagamento: sale.formaPagamento,
            itens: sale.itens.map(item => {
                const productInfo = products.find(p => p.id === item.productId);
                return {
                    nomeProduto: productInfo?.nome || item.sku || 'Produto Desconhecido',
                    sku: item.sku,
                    quantidade: item.qtde,
                    precoVendaUnitario: item.precoUnit,
                    precoCustoUnitario: item.precoCusto || item.precoUnit * 0.7
                }
            })
        };
    };

    // Filtrar vendas
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                if (new Date(sale.dataHora) < startDate) return false;
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(sale.dataHora) > endDate) return false;
            }
            if (filters.source !== 'all') {
                const sourceMatch = filters.source === 'native' ? 'NATIVA' : 'IMPORTADA';
                if (sale.origem !== sourceMatch) return false;
            }
            if (filters.minValue && sale.valorTotal < parseFloat(filters.minValue)) return false;
            if (filters.maxValue && sale.valorTotal > parseFloat(filters.maxValue)) return false;
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const matchesId = sale.id.toLowerCase().includes(searchLower);
                const matchesItems = sale.itens.some(item => 
                    item.nomeProduto.toLowerCase().includes(searchLower)
                );
                if (!matchesId && !matchesItems) return false;
            }
            return true;
        });
    }, [sales, filters]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = filteredSales.reduce((sum, sale) => sum + sale.valorTotal, 0);
        const totalCusto = filteredSales.reduce((sum, sale) => sum + sale.custoTotal, 0);
        const totalLucro = total - totalCusto;
        const ticketMedio = filteredSales.length > 0 ? total / filteredSales.length : 0;

        return {
            totalVendas: filteredSales.length,
            valorTotal: total,
            ticketMedio,
            lucroBruto: totalLucro,
            margemMedia: totalCusto > 0 ? (totalLucro / totalCusto) * 100 : 0
        };
    }, [filteredSales]);

    // Funções de seleção
    const toggleSelectSale = (saleId) => {
        const newSelected = new Set(selectedSales);
        if (newSelected.has(saleId)) {
            newSelected.delete(saleId);
        } else {
            newSelected.add(saleId);
        }
        setSelectedSales(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedSales.size === filteredSales.length) {
            setSelectedSales(new Set());
        } else {
            setSelectedSales(new Set(filteredSales.map(s => s.id)));
        }
    };

    const isAllSelected = selectedSales.size > 0 && selectedSales.size === filteredSales.length;
    const isSomeSelected = selectedSales.size > 0 && selectedSales.size < filteredSales.length;

    // Função de exclusão
    const handleDeleteSelected = () => {
        if (selectedSales.size === 0) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        try {
            const allSales = getItem('sales') || [];
            const updatedSales = allSales.filter(sale => !selectedSales.has(sale.id));
            setItem('sales', updatedSales);
            
            setShowDeleteModal(false);
            loadSales();
            
            alert(`${selectedSales.size} venda(s) excluída(s) com sucesso!`);
        } catch (error) {
            console.error('Erro ao excluir vendas:', error);
            alert('Erro ao excluir vendas. Tente novamente.');
        }
    };

    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        setShowDetailModal(true);
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            source: 'all',
            searchTerm: '',
            minValue: '',
            maxValue: ''
        });
    };

    if (!user) {
        return <Container><p>Carregando...</p></Container>;
    }

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Histórico de Vendas</h1>
                    <p className="text-muted mb-0">Visualize e analise todas as transações realizadas</p>
                </div>
                {selectedSales.size > 0 && (
                    <Button 
                        variant="danger" 
                        onClick={handleDeleteSelected}
                        className="d-flex align-items-center"
                    >
                        <Trash className="me-2" />
                        Excluir ({selectedSales.size})
                    </Button>
                )}
            </div>

            {/* KPIs */}
            <Row className="mb-4">
                 <Col md={4} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Total de Vendas</p>
                            <h4 className="mb-0">{stats.totalVendas}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Valor Total</p>
                            <h4 className="mb-0 text-success">R$ {stats.valorTotal.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Ticket Médio</p>
                            <h4 className="mb-0">R$ {stats.ticketMedio.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Lucro Bruto</p>
                            <h4 className="mb-0 text-primary">R$ {stats.lucroBruto.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Margem Média</p>
                            <h4 className="mb-0">{stats.margemMedia.toFixed(1)}%</h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                        <FunnelFill className="me-2 text-primary" />
                        <h6 className="mb-0">Filtros</h6>
                        {Object.values(filters).some(f => f && f !== 'all') && (
                            <Button 
                                variant="link" 
                                size="sm" 
                                className="ms-auto text-decoration-none"
                                onClick={clearFilters}
                            >
                                <XCircle className="me-1" />
                                Limpar Filtros
                            </Button>
                        )}
                    </div>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small">Data Início</Form.Label>
                                <Form.Control 
                                    type="date"
                                    size="sm"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small">Data Fim</Form.Label>
                                <Form.Control 
                                    type="date"
                                    size="sm"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small">Origem</Form.Label>
                                <Form.Select 
                                    size="sm"
                                    value={filters.source}
                                    onChange={(e) => setFilters({...filters, source: e.target.value})}
                                >
                                    <option value="all">Todas</option>
                                    <option value="native">Nativa</option>
                                    <option value="imported">Importada</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small">Valor Mín.</Form.Label>
                                <Form.Control 
                                    type="number"
                                    size="sm"
                                    placeholder="0.00"
                                    value={filters.minValue}
                                    onChange={(e) => setFilters({...filters, minValue: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small">Valor Máx.</Form.Label>
                                <Form.Control 
                                    type="number"
                                    size="sm"
                                    placeholder="0.00"
                                    value={filters.maxValue}
                                    onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <InputGroup size="sm">
                                <InputGroup.Text>
                                    <Search />
                                </InputGroup.Text>
                                <Form.Control 
                                    placeholder="Buscar por ID ou produto..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Tabela de Vendas */}
            <Card>
                <Card.Body className="p-0">
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <Table hover responsive className="mb-0 align-middle">
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                                <tr>
                                    <th style={{ width: '50px' }}>
                                        <Form.Check
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={input => {
                                                if (input) input.indeterminate = isSomeSelected;
                                            }}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>Data/Hora</th>
                                    <th>ID Transação</th>
                                    <th>Origem</th>
                                    <th className="text-center">Itens</th>
                                    <th className="text-end">Valor Total</th>
                                    <th className="text-end">Lucro</th>
                                    <th className="text-end">Margem</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center text-muted py-4">
                                            Nenhuma venda encontrada com os filtros aplicados
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map(sale => (
                                        <tr 
                                            key={sale.id}
                                            className={selectedSales.has(sale.id) ? 'table-active' : ''}
                                        >
                                            <td>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedSales.has(sale.id)}
                                                    onChange={() => toggleSelectSale(sale.id)}
                                                />
                                            </td>
                                            <td>
                                                <small>
                                                    {new Date(sale.dataHora).toLocaleDateString('pt-BR')}<br/>
                                                    {new Date(sale.dataHora).toLocaleTimeString('pt-BR')}
                                                </small>
                                            </td>
                                            <td><small className="font-monospace">{sale.id.substring(0, 9)}...</small></td>
                                            <td>
                                                <Badge bg={sale.origem === 'NATIVA' ? 'primary' : 'info'}>
                                                    {sale.origem}
                                                </Badge>
                                            </td>
                                            <td className="text-center">{sale.totalItens}</td>
                                            <td className="text-end fw-bold">R$ {sale.valorTotal.toFixed(2)}</td>
                                            <td className="text-end text-success">R$ {sale.lucroBruto.toFixed(2)}</td>
                                            <td className="text-end">{sale.margemLucroPercentual.toFixed(1)}%</td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleViewDetails(sale)}
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal de Detalhes */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Detalhes da Venda</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSale && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p className="mb-1"><strong>ID:</strong> <span className="font-monospace">{selectedSale.id}</span></p>
                                    <p className="mb-1"><strong>Data/Hora:</strong> {new Date(selectedSale.dataHora).toLocaleString('pt-BR')}</p>
                                    <p className="mb-1"><strong>Origem:</strong> <Badge bg={selectedSale.origem === 'NATIVA' ? 'primary' : 'info'}>{selectedSale.origem}</Badge></p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1"><strong>Total de Itens:</strong> {selectedSale.totalItens}</p>
                                    <p className="mb-1"><strong>Valor Total:</strong> <span className="text-success fw-bold">R$ {selectedSale.valorTotal.toFixed(2)}</span></p>
                                    <p className="mb-1"><strong>Lucro Bruto:</strong> <span className="text-primary fw-bold">R$ {selectedSale.lucroBruto.toFixed(2)}</span></p>
                                    <p className="mb-1"><strong>Margem:</strong> {selectedSale.margemLucroPercentual.toFixed(1)}%</p>
                                </Col>
                            </Row>
                            <hr/>
                            <h6>Itens da Venda</h6>
                            <Table size="sm" striped>
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th className="text-center">Qtd</th>
                                        <th className="text-end">Preço Unit.</th>
                                        <th className="text-end">Custo Unit.</th>
                                        <th className="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.itens.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.nomeProduto}</td>
                                            <td className="text-center">{item.quantidade}</td>
                                            <td className="text-end">R$ {item.precoVendaUnitario.toFixed(2)}</td>
                                            <td className="text-end text-muted">R$ {item.precoCustoUnitario.toFixed(2)}</td>
                                            <td className="text-end fw-bold">R$ {(item.quantidade * item.precoVendaUnitario).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Fechar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning" className="mb-3">
                        <strong>⚠️ Atenção!</strong> Esta ação não pode ser desfeita.
                    </Alert>
                    <p>
                        Você está prestes a excluir <strong>{selectedSales.size}</strong> venda(s).
                        Tem certeza que deseja continuar?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        <Trash className="me-2" />
                        Sim, Excluir
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SalesHistory;