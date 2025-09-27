// --- ARQUIVO: src/pages/retail/pos/TraditionalPOS.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este componente é a tela de Ponto de Venda (PDV) principal, com uma interface
// mais tradicional, onde o usuário clica nos produtos para adicioná-los ao carrinho.

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, getClientsByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Form, Button, Table, Card, InputGroup, Alert } from 'react-bootstrap';

// Definição do componente funcional `TraditionalPOS`.
const TraditionalPOS = () => {
  // Pega os dados do usuário logado do nosso hook de autenticação.
  const { user } = useAuth();
  
  // --- ESTADOS DO COMPONENTE ---
  const [cart, setCart] = useState([]); // Guarda os itens do carrinho de compras.
  const [searchTerm, setSearchTerm] = useState(''); // Guarda o texto digitado na busca.
  const [selectedClient, setSelectedClient] = useState(''); // Guarda o ID do cliente selecionado.
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro'); // Guarda a forma de pagamento.
  const [error, setError] = useState(''); // Para mensagens de erro.
  const [success, setSuccess] = useState(''); // Para mensagens de sucesso.

  // `useMemo` para otimizar a busca de dados. Estas listas só serão recarregadas se o `user` mudar.
  const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);
  const clients = useMemo(() => user ? getClientsByRetailer(user.actorId) : [], [user]);
  
  // Outro `useMemo` para a lógica de busca de produtos.
  // A lista de `searchResults` só será recalculada se `searchTerm` ou `inventory` mudarem.
  const searchResults = useMemo(() => {
    // Pega apenas os itens que têm estoque maior que zero.
    const itemsInStock = inventory.filter(item => item.estoque > 0);
    // Se a busca estiver vazia, retorna todos os itens em estoque.
    if (!searchTerm) return itemsInStock;
    
    // Se houver texto na busca, filtra os itens cujo nome ou SKU contém o texto digitado.
    return itemsInStock.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, inventory]);

  // Função para adicionar um produto ao carrinho.
  const addToCart = (product) => {
    // Verifica se o item já está no carrinho.
    const existingItem = cart.find(item => item.productId === product.productId);
    if (existingItem) {
      // Se já existe e a quantidade no carrinho é menor que o estoque...
      if (existingItem.qtde < product.estoque) {
        // ... aumenta a quantidade em 1.
        setCart(cart.map(item => item.productId === product.productId ? { ...item, qtde: item.qtde + 1 } : item));
      } else {
        // Se não, mostra um erro de estoque máximo.
        setError(`Estoque máximo para "${product.nome}" atingido.`);
        setTimeout(() => setError(''), 3000); // O erro some depois de 3 segundos.
      }
    } else {
      // Se o item não está no carrinho, adiciona-o com quantidade 1.
      setCart([...cart, { ...product, qtde: 1, precoUnit: product.precoSugerido }]);
    }
  };
  
  // Calcula o valor total do carrinho. `reduce` soma os subtotais de cada item.
  const cartTotal = cart.reduce((total, item) => total + (item.precoUnit * item.qtde), 0);

  // Função chamada ao clicar em "Finalizar Venda".
  const handleFinalizeSale = () => {
    // Validações básicas.
    if (cart.length === 0) {
        setError('O carrinho está vazio.'); return;
    }
    if (!selectedClient) {
        setError('Por favor, selecione um cliente.'); return;
    }

    // Cria um novo objeto de venda com todos os dados necessários.
    const newSale = {
      id: generateId(), retailerId: user.actorId, dataISO: new Date().toISOString(), clienteId: selectedClient,
      itens: cart.map(item => ({ productId: item.productId, sku: item.sku, qtde: item.qtde, precoUnit: item.precoUnit })),
      totalBruto: cartTotal, desconto: 0, totalLiquido: cartTotal, formaPagamento: paymentMethod,
    };

    // Salva a nova venda no localStorage.
    const allSales = getItem('sales') || [];
    setItem('sales', [...allSales, newSale]);

    // Atualiza o estoque no localStorage, subtraindo os itens vendidos.
    const currentInventory = getItem('inventory') || [];
    const updatedInventory = currentInventory.map(invItem => {
      const cartItem = cart.find(c => c.productId === invItem.productId);
      if (cartItem) {
        return { ...invItem, estoque: invItem.estoque - cartItem.qtde };
      }
      return invItem;
    });
    setItem('inventory', updatedInventory);

    // Mostra mensagem de sucesso e limpa os estados para a próxima venda.
    setSuccess(`Venda finalizada com sucesso!`);
    setTimeout(() => setSuccess(''), 3000);
    setCart([]);
    setSearchTerm('');
    setSelectedClient('');
    setError('');
  };
  
  // Mostra mensagem de carregamento enquanto os dados do usuário não chegam.
  if (!user) {
    return <Container><p>Carregando PDV...</p></Container>;
  }

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <Container fluid>
        <Row>
            {/* Coluna da Esquerda: Busca e Lista de Produtos */}
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
                
                {/* A lista de produtos é renderizada aqui. `.map` cria um Card para cada produto. */}
                <Row style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                    {searchResults.map(item => (
                        <Col xl={3} lg={4} md={6} key={item.id} className="mb-3">
                            <Card className="product-card h-100" onClick={() => addToCart(item)}>
                                <Card.Img variant="top" src={`https://via.placeholder.com/200x150/EEEEEE/999999?text=${item.sku}`} className="product-card-img" />
                                <Card.Body className="d-flex flex-column">
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

            {/* Coluna da Direita: Carrinho e Finalização da Venda */}
            <Col md={5}>
                <Card style={{ height: 'calc(100vh - 110px)' }}>
                    <Card.Body className="d-flex flex-column">
                        <Card.Title>Carrinho</Card.Title>
                        {success && <Alert variant="success">{success}</Alert>}
                        {error && <Alert variant="danger">{error}</Alert>}
                        {/* A tabela de itens do carrinho */}
                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Qtd</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
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
                        {/* Seção inferior com total, seleção de cliente/pagamento e botão de finalizar */}
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

