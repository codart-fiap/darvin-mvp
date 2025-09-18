// FILE: src/pages/retail/pos/TraditionalPOS.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, getClientsByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Form, Button, Table, Card, InputGroup, Alert } from 'react-bootstrap';

const TraditionalPOS = () => {
  const { user } = useAuth();
  
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);
  const clients = useMemo(() => user ? getClientsByRetailer(user.actorId) : [], [user]);
  
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
      setCart([...cart, { ...product, qtde: 1, precoUnit: product.precoSugerido }]);
    }
  };
  
  const cartTotal = cart.reduce((total, item) => total + (item.precoUnit * item.qtde), 0);

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
        setError('O carrinho está vazio.'); return;
    }
    if (!selectedClient) {
        setError('Por favor, selecione um cliente.'); return;
    }

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

  if (!user) {
    return <Container><p>Carregando PDV...</p></Container>;
  }

  return (
    <Container fluid>
        <Row>
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
                                <Card.Img variant="top" src={`https://via.placeholder.com/200x150/EEEEEE/999999?text=${item.sku}`} className="product-card-img" />
                                <Card.Body className="d-flex flex-column">
                                    {/* <-- ADICIONADO: Exibição da marca --> */}
                                    <Card.Text className="text-muted mb-1"><small>{item.marca}</small></Card.Text>
                                    <Card.Title as="h6" className="mb-1" style={{ fontSize: '0.9rem', flexGrow: 1 }}>{item.nome}</Card.Title>
                                    <Card.Text className="mb-0">
                                        <small>Estoque: {item.estoque}</small>
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer>
                                    <strong>R$ {item.precoSugerido.toFixed(2)}</strong>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Col>

            <Col md={5}>
                <Card style={{ height: 'calc(100vh - 110px)' }}>
                    <Card.Body className="d-flex flex-column">
                        <Card.Title>Carrinho</Card.Title>
                        {success && <Alert variant="success">{success}</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}
                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
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
                        <div className="mt-auto">
                            <h4 className="text-end">Total: R$ {cartTotal.toFixed(2)}</h4>
                            <hr/>
                            <Form.Group className="mb-3">
                                <Form.Label>Cliente</Form.Label>
                                <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {clients.map(client => <option key={client.id} value={client.id}>{client.nome}</option>)}
                                </Form.Select>
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
    </Container>
  );
};

export default TraditionalPOS;