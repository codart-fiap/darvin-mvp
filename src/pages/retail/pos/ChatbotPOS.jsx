// FILE: src/pages/retail/pos/ChatbotPOS.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, parseTextToCart } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Form, Button, Card, Alert, ListGroup } from 'react-bootstrap';

const ChatbotPOS = () => {
    const { user } = useAuth();
    
    const [inputText, setInputText] = useState('');
    const [error, setError] = useState('');
    const [lastSale, setLastSale] = useState(null); // Para mostrar a confirmação da última venda

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);

    const handleRegisterSale = () => {
        setError('');
        setLastSale(null);

        if (!inputText.trim()) {
            setError('Por favor, digite os itens da venda.');
            return;
        }

        const result = parseTextToCart(inputText, inventory);

        if (result.notFound.length > 0) {
            setError(`Não foi possível encontrar: ${result.notFound.join(', ')}.`);
            return;
        }

        if (result.items.length === 0) {
            setError('Nenhum item válido foi processado. Verifique o texto e o estoque.');
            return;
        }

        const cartTotal = result.items.reduce((total, item) => total + (item.precoUnit * item.qtde), 0);

        // Cria a venda com valores padrão
        const newSale = {
            id: generateId(),
            retailerId: user.actorId,
            dataISO: new Date().toISOString(),
            clienteId: 'consumidor_final', // Cliente padrão
            itens: result.items.map(item => ({ productId: item.productId, sku: item.sku, qtde: item.qtde, precoUnit: item.precoUnit })),
            totalBruto: cartTotal,
            desconto: 0,
            totalLiquido: cartTotal,
            formaPagamento: 'Anotado', // Forma de pagamento padrão
        };

        // Salva a venda
        const allSales = getItem('sales') || [];
        setItem('sales', [...allSales, newSale]);

        // Atualiza o estoque
        const currentInventory = getItem('inventory') || [];
        const updatedInventory = currentInventory.map(invItem => {
            const cartItem = result.items.find(c => c.productId === invItem.productId);
            if (cartItem) {
                return { ...invItem, estoque: invItem.estoque - cartItem.qtde };
            }
            return invItem;
        });
        setItem('inventory', updatedInventory);

        // Limpa o campo e exibe a confirmação
        setLastSale(newSale);
        setInputText('');
    };

    if (!user) {
        return <Container><p>Carregando...</p></Container>;
    }

    return (
        <Container fluid>
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Anota Aí</Card.Title>
                            <Card.Subtitle className="mb-3 text-muted">
                                Anote uma venda rápida. Ex: "Vendi 2 sabonete e 1 café"
                            </Card.Subtitle>
                            
                            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                            
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Digite a venda aqui..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="mb-3"
                            />
                            <div className="d-grid">
                                <Button onClick={handleRegisterSale}>Registrar Venda</Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {lastSale && (
                        <Card className="mt-4">
                            <Card.Body>
                                <Card.Title className="text-success">Venda Registrada com Sucesso!</Card.Title>
                                <ListGroup variant="flush">
                                    {lastSale.itens.map(item => {
                                        // Precisamos encontrar o nome do produto novamente para exibição
                                        const product = inventory.find(i => i.productId === item.productId);
                                        return (
                                            <ListGroup.Item key={item.productId}>
                                                {item.qtde}x {product?.nome || 'Produto'} - R$ {(item.qtde * item.precoUnit).toFixed(2)}
                                            </ListGroup.Item>
                                        );
                                    })}
                                    <ListGroup.Item className="fw-bold">
                                        Total: R$ {lastSale.totalLiquido.toFixed(2)}
                                    </ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ChatbotPOS;