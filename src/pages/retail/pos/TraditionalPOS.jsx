// --- ARQUIVO ATUALIZADO E CORRIGIDO: src/pages/retail/pos/TraditionalPOS.jsx ---
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, getClientsByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Form, Button, Table, Card, InputGroup, Alert, Modal } from 'react-bootstrap';
// --- ÍCONES ADICIONADOS ---
import { PlusCircleFill, PlusCircle, DashCircle, Trash3Fill } from 'react-bootstrap-icons';

const TraditionalPOS = () => {
  
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nome: '', sexo: 'Prefiro não informar', idade: '' });
  
  const [clientList, setClientList] = useState([]);

  // Carrega a lista de clientes assim que o usuário estiver disponível
  useEffect(() => {
    if (user) {
      const retailerClients = getClientsByRetailer(user.actorId);
      setClientList([
        { id: 'consumidor_final', nome: 'Consumidor Final' }, 
        ...retailerClients
      ]);
      setSelectedClient('consumidor_final'); 
    }
  }, [user]);


  // Recarrega o inventário quando uma venda é finalizada
  const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user, lastUpdated]);
  
  const searchResults = useMemo(() => {
    const itemsInStock = inventory.filter(item => item.totalStock > 0);
    if (!searchTerm) return itemsInStock;
    return itemsInStock.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, inventory]);

  // --- NOVAS FUNÇÕES DE GERENCIAMENTO DO CARRINHO ---

  /**
   * Remove um produto completamente do carrinho.
   */
  const removeFromCart = (productId) => {
    setCart(currentCart => currentCart.filter(item => item.productId !== productId));
  };

  /**
   * Altera a quantidade de um item no carrinho.
   * @param {string} productId - O ID do produto a ser alterado.
   * @param {number} change - A mudança na quantidade (ex: +1 ou -1).
   */
  const handleQuantityChange = (productId, change) => {
    setCart(currentCart => {
        const itemToUpdate = currentCart.find(item => item.productId === productId);
        if (!itemToUpdate) return currentCart; // Item não encontrado

        const newQuantity = itemToUpdate.qtde + change;

        if (newQuantity <= 0) {
            // Remove o item se a quantidade for zero ou menos
            return currentCart.filter(item => item.productId !== productId);
        }

        // Verifica contra o estoque (itemToUpdate tem totalStock vindo do inventory)
        if (newQuantity > itemToUpdate.totalStock) {
            setError(`Estoque máximo para "${itemToUpdate.nome}" atingido (${itemToUpdate.totalStock} un.)`);
            setTimeout(() => setError(''), 3000);
            return currentCart; // Não atualiza
        }

        // Atualiza a quantidade do item
        return currentCart.map(item =>
            item.productId === productId ? { ...item, qtde: newQuantity } : item
        );
    });
  };

  /**
   * Adiciona um produto ao carrinho ou incrementa a quantidade se já existir.
   */
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.productId);
    if (existingItem) {
      // Se já existe, apenas incrementa a quantidade usando a nova função
      handleQuantityChange(product.productId, 1);
    } else {
      // Adiciona o novo item. 'product' já contém 'totalStock' vindo do seletor.
      setCart([...cart, { ...product, qtde: 1, precoUnit: product.avgPrice }]);
    }
  };
  
  // --- FIM DAS NOVAS FUNÇÕES ---
  
  const cartTotal = cart.reduce((total, item) => total + (item.precoUnit * item.qtde), 0);

 // --- LÓGICA DE VENDA APRIMORADA (FEFO - First Expired, First Out) ---
  const handleFinalizeSale = () => {
    if (cart.length === 0) { 
      setError('O carrinho está vazio.'); 
      return; 
    }
    
    const clientIdForSale = selectedClient || 'consumidor_final';

    // 1. CRÍTICO: Pegar o inventário RAW (não agrupado) do localStorage
    let rawInventory = getItem('inventory') || [];
    console.log('[PDV] 🔍 Estoque RAW ANTES da baixa:', rawInventory.length, 'lotes');

    // 2. Processa cada item do carrinho
    for (const cartItem of cart) {
        let quantityToDeduct = cartItem.qtde;
        console.log(`[PDV] 📦 Processando: ${cartItem.nome} (ProductID: ${cartItem.productId}), Qtd: ${quantityToDeduct}`);

        // Filtra lotes DESTE VAREJISTA E DESTE PRODUTO com estoque disponível
        const availableBatches = rawInventory
            .map((batch, index) => ({ ...batch, arrayIndex: index })) // Guarda o índice original
            .filter(batch => 
                batch.retailerId === user.actorId && 
                batch.productId === cartItem.productId && 
                batch.estoque > 0
            )
            .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade)); // FEFO

        console.log(`[PDV] 📋 Lotes disponíveis:`, availableBatches.map(b => ({
            id: b.id.substring(0, 8),
            estoque: b.estoque,
            validade: b.dataValidade
        })));

        // Deduz quantidade lote por lote
        for (const batch of availableBatches) {
            if (quantityToDeduct === 0) break;
            
            const deductAmount = Math.min(quantityToDeduct, batch.estoque);
            console.log(`[PDV]   ➖ Lote ${batch.id.substring(0, 8)}: Deduzindo ${deductAmount} (Tinha: ${batch.estoque})`);
            
            // Atualiza o array original usando o índice guardado
            rawInventory[batch.arrayIndex].estoque -= deductAmount;
            quantityToDeduct -= deductAmount;
            
            console.log(`[PDV]   ✅ Lote ${batch.id.substring(0, 8)}: Agora tem ${rawInventory[batch.arrayIndex].estoque}`);
        }

        if (quantityToDeduct > 0) {
            console.error(`[PDV] ❌ ERRO: Faltam ${quantityToDeduct} unidades de ${cartItem.nome}!`);
            setError(`Estoque insuficiente para ${cartItem.nome}`);
            return; // Cancela a venda
        }
    }
    
    console.log('[PDV] 💾 Salvando inventário atualizado...');
    
    // 3. Salva o inventário atualizado
    setItem('inventory', rawInventory);
    
    // Verifica se salvou
    const verificacao = getItem('inventory');
    console.log('[PDV] ✅ Verificação pós-salvamento:', verificacao.length, 'lotes');

    // 4. Cria e salva a venda
    const newSale = {
      id: generateId(), 
      retailerId: user.actorId, 
      dataISO: new Date().toISOString(), 
      clienteId: clientIdForSale, 
      itens: cart.map(item => ({ 
        productId: item.productId, 
        sku: item.sku, 
        qtde: item.qtde, 
        precoUnit: item.precoUnit 
      })),
      totalBruto: cartTotal, 
      desconto: 0, 
      totalLiquido: cartTotal, 
      formaPagamento: paymentMethod,
    };

    const allSales = getItem('sales') || [];
    setItem('sales', [...allSales, newSale]);
    console.log('[PDV] 💰 Venda registrada!');

    // 5. Limpa o estado e força atualização
    setSuccess(`Venda finalizada! Estoque atualizado.`);
    setTimeout(() => setSuccess(''), 3000);
    setCart([]);
    setSearchTerm('');
    setSelectedClient('consumidor_final'); 
    setError('');
    
    // FORÇA o reload do inventário
    setLastUpdated(Date.now());
    console.log('[PDV] 🔄 Forçando reload do inventário...');
  };

  const handleSaveNewClient = () => {
      if (!newClient.nome || !newClient.idade) {
          return;
      }
      const allClients = getItem('clients') || [];
      const clientData = {
          id: generateId(), retailerId: user.actorId, ...newClient,
          idade: Number(newClient.idade), habitoCompra: 'Ocasional'
      };

      const updatedClients = [...allClients, clientData];
      setItem('clients', updatedClients);
      
      const retailerClients = updatedClients.filter(c => c.retailerId === user.actorId);
      setClientList([
          { id: 'consumidor_final', nome: 'Consumidor Final' }, 
          ...retailerClients
      ]);
      setSelectedClient(clientData.id); 
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
                        <Col xl={3} lg={4} md={6} key={item.productId} className="mb-3">
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
                                        <small>Estoque: {item.totalStock}</small>
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer>
                                    <strong>R$ {item.avgPrice.toFixed(2)}</strong>
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
                        
                        {/* --- TABELA DO CARRINHO ATUALIZADA --- */}
                        <div className="pos-cart-items">
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-center">Qtd</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.productId}>
                                            <td>
                                                <small>{item.nome}</small>
                                            </td>
                                            <td className="text-center" style={{ minWidth: '100px' }}>
                                                {/* Botão de diminuir */}
                                                <Button variant="link" size="sm" onClick={() => handleQuantityChange(item.productId, -1)} className="p-1 text-danger">
                                                    <DashCircle />
                                                </Button>
                                                <span className="mx-2 fw-bold">{item.qtde}</span>
                                                {/* Botão de aumentar */}
                                                <Button variant="link" size="sm" onClick={() => handleQuantityChange(item.productId, 1)} className="p-1 text-success">
                                                    <PlusCircle />
                                                </Button>
                                            </td>
                                            <td>
                                                <strong>R$ {(item.precoUnit * item.qtde).toFixed(2)}</strong>
                                            </td>
                                            <td className="text-end">
                                                {/* Botão de excluir item */}
                                                <Button variant="link" size="sm" onClick={() => removeFromCart(item.productId)} className="text-danger p-1">
                                                    <Trash3Fill />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                        {/* --- FIM DA ATUALIZAÇÃO DA TABELA --- */}
                        
                        <div className="pos-cart-footer">
                            <h4 className="text-end">Total: R$ {cartTotal.toFixed(2)}</h4>
                            <hr/>
                            <Form.Group className="mb-3">
                                <Form.Label>Cliente (Opcional)</Form.Label> 
                                <InputGroup>
                                    <Form.Select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
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

//teste