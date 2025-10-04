// --- ARQUIVO ATUALIZADO: src/pages/retail/pos/TraditionalPOS.jsx ---
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, getClientsByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Form, Button, Table, Card, InputGroup, Alert, Modal } from 'react-bootstrap';
import { PlusCircleFill } from 'react-bootstrap-icons';

const TraditionalPOS = () => {
  
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para o modal de novo cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nome: '', sexo: 'Prefiro não informar', idade: '' });
  const [clientList, setClientList] = useState(() => user ? getClientsByRetailer(user.actorId) : []);

  const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);
  
  const searchResults = useMemo(() => {
    const itemsInStock = inventory.filter(item => item.estoque > 0);
    if (!searchTerm) return itemsInStock;
    return itemsInStock.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, inventory]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.productId);
    if (existingItem) {
      if (existingItem.qtde < product.estoque) {
        setCart(cart.map(item => item.productId === product.productId ? { ...item, qtde: item.qtde + 1 } : item));
      } else {
        setError(`Estoque máximo para "${product.nome}" atingido.`);
        setTimeout(() => setError(''), 3000);
      }
    } else {
      setCart([...cart, { ...product, qtde: 1, precoUnit: product.precoVenda }]);
    }
  };
  
  const cartTotal = cart.reduce((total, item) => total + (item.precoUnit * item.qtde), 0);

  const handleFinalizeSale = () => {
    if (cart.length === 0) { setError('O carrinho está vazio.'); return; }
    if (!selectedClient) { setError('Por favor, selecione um cliente.'); return; }

    const newSale = {
      id: generateId(), retailerId: user.actorId, dataISO: new Date().toISOString(), clienteId: selectedClient,
      itens: cart.map(item => ({ productId: item.productId, sku: item.sku, qtde: item.qtde, precoUnit: item.precoUnit })),
      totalBruto: cartTotal, desconto: 0, totalLiquido: cartTotal, formaPagamento: paymentMethod,
    };

    const allSales = getItem('sales') || [];
    setItem('sales', [...allSales, newSale]);

    const currentInventory = getItem('inventory') || [];
    const updatedInventory = currentInventory.map(invItem => {
      const cartItem = cart.find(c => c.productId === invItem.productId);
      if (cartItem) {
        return { ...invItem, estoque: invItem.estoque - cartItem.qtde };
      }
      return invItem;
    });
    setItem('inventory', updatedInventory);

    setSuccess(`Venda finalizada com sucesso!`);
    setTimeout(() => setSuccess(''), 3000);
    setCart([]);
    setSearchTerm('');
    setSelectedClient('');
    setError('');
  };

  const handleSaveNewClient = () => {
      if (!newClient.nome || !newClient.idade) {
          // Adicionar validação se necessário
          return;
      }
      const allClients = getItem('clients') || [];
      const clientData = {
          id: generateId(),
          retailerId: user.actorId,
          ...newClient,
          idade: Number(newClient.idade),
          habitoCompra: 'Ocasional' // Padrão
      };

      const updatedClients = [...allClients, clientData];
      setItem('clients', updatedClients);
      setClientList(updatedClients.filter(c => c.retailerId === user.actorId));
      setSelectedClient(clientData.id); // Seleciona o novo cliente
      setShowNewClientModal(false);
      setNewClient({ nome: '', sexo: 'Prefiro não informar', idade: '' });
  };
  
  if (!user) {
    return <Container><p>Carregando PDV...</p></Container>;
  }

  return (
    <Container fluid>
        <Row>
            {/* Coluna da Esquerda: Produtos */}
            <Col md={7}>
                <div className="mb-3">
                    <InputGroup>
                        <Form.Control
                            placeholder="Digite para buscar um produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
                
                <Row style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                    {searchResults.map(item => (
                        <Col xl={3} lg={4} md={6} key={item.id} className="mb-3">
                            <Card className="product-card h-100" onClick={() => addToCart(item)}>
                                <Card.Img 
                                    variant="top" 
                                    src={item.logo || `https://via.placeholder.com/200x150/EEEEEE/999999?text=${item.sku}`} 
                                    className="product-card-img" 
                                    style={{ objectFit: 'contain', padding: '1rem' }} 
                                />
                                <Card.Body className="d-flex flex-column">
                                    <Card.Text className="text-muted mb-1"><small>{item.marca}</small></Card.Text>
                                    <Card.Title as="h6" className="mb-1" style={{ fontSize: '0.9rem', flexGrow: 1 }}>{item.nome}</Card.Title>
                                    <Card.Text className="mb-0">
                                        <small>Estoque: {item.estoque}</small>
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer>
                                    <strong>R$ {item.precoVenda.toFixed(2)}</strong>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Col>

            {/* Coluna da Direita: Carrinho (Comanda) */}
            <Col md={5}>
                <Card className="pos-cart">
                    <Card.Body>
                        <Card.Title>Comanda</Card.Title>

                        {success && <Alert variant="success">{success}</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}
                        
                        <div className="pos-cart-items">
                            <Table hover>
                                <thead><tr><th>Item</th><th>Qtd</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.productId}>
                                            <td><small>{item.nome}</small></td>
                                            <td>{item.qtde}</td>
                                            <td>R$ {(item.precoUnit * item.qtde).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                        
                        <div className="pos-cart-footer">
                            <h4 className="text-end">Total: R$ {cartTotal.toFixed(2)}</h4>
                            <hr/>
                            <Form.Group className="mb-3">
                                <Form.Label>Cliente</Form.Label>
                                <InputGroup>
                                    <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {clientList.map(client => <option key={client.id} value={client.id}>{client.nome}</option>)}
                                    </Form.Select>
                                    <Button variant="outline-secondary" onClick={() => setShowNewClientModal(true)}>
                                        <PlusCircleFill/>
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Forma de Pagamento</Form.Label>
                                <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="Cartão de Débito">Cartão de Débito</option>
                                    <option value="Pix">Pix</option>
                                </Form.Select>
                            </Form.Group>
                            <Button className="w-100" onClick={handleFinalizeSale} disabled={cart.length === 0}>Finalizar Venda</Button>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>

        {/* Modal de Novo Cliente */}
        <Modal show={showNewClientModal} onHide={() => setShowNewClientModal(false)} centered>
            <Modal.Header closeButton><Modal.Title>Cadastrar Novo Cliente</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome Completo</Form.Label>
                        <Form.Control type="text" value={newClient.nome} onChange={(e) => setNewClient({...newClient, nome: e.target.value})} autoFocus/>
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Idade</Form.Label>
                                <Form.Control type="number" value={newClient.idade} onChange={(e) => setNewClient({...newClient, idade: e.target.value})}/>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Sexo</Form.Label>
                                <Form.Select value={newClient.sexo} onChange={(e) => setNewClient({...newClient, sexo: e.target.value})}>
                                    <option>Prefiro não informar</option>
                                    <option>Feminino</option>
                                    <option>Masculino</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowNewClientModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={handleSaveNewClient}>Salvar Cliente</Button>
            </Modal.Footer>
        </Modal>
    </Container>
  );
};

export default TraditionalPOS;