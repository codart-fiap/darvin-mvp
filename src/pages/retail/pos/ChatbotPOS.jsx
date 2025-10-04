// FILE: src/pages/retail/pos/ChatbotPOS.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Form, Button, Card, Alert, ListGroup, InputGroup } from 'react-bootstrap';

const ChatbotPOS = () => {
    const { user } = useAuth();
    
    // Estados para os novos campos do formulário
    const [quantity, setQuantity] = useState(1);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [price, setPrice] = useState(0);

    const [error, setError] = useState('');
    const [lastSale, setLastSale] = useState(null);

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId).filter(item => item.estoque > 0) : [], [user]);

    // Efeito para atualizar o preço quando um produto é selecionado
    useEffect(() => {
        if (selectedProductId) {
            const product = inventory.find(item => item.productId === selectedProductId);
            if (product) {
                setPrice(product.precoVenda);
            }
        } else {
            setPrice(0);
        }
    }, [selectedProductId, inventory]);


    const handleRegisterSale = () => {
        setError('');
        setLastSale(null);

        if (!selectedProductId) {
            setError('Por favor, selecione um produto.');
            return;
        }

        if (isNaN(quantity) || quantity <= 0) {
            setError('A quantidade deve ser um número maior que zero.');
            return;
        }
        
        if (isNaN(price) || price < 0) {
            setError('O valor deve ser um número positivo.');
            return;
        }

        const productInInventory = inventory.find(item => item.productId === selectedProductId);

        if (!productInInventory) {
            setError('Produto não encontrado no estoque.');
            return;
        }

        if (productInInventory.estoque < quantity) {
            setError(`Estoque insuficiente para "${productInInventory.nome}". Disponível: ${productInInventory.estoque}`);
            return;
        }
        
        const cartTotal = price * quantity;

        const newSale = {
            id: generateId(),
            retailerId: user.actorId,
            dataISO: new Date().toISOString(),
            clienteId: 'consumidor_final',
            itens: [{ 
                productId: productInInventory.productId, 
                sku: productInInventory.sku, 
                qtde: Number(quantity), 
                precoUnit: Number(price) 
            }],
            totalBruto: cartTotal,
            desconto: 0,
            totalLiquido: cartTotal,
            formaPagamento: 'Anotado',
        };

        const allSales = getItem('sales') || [];
        setItem('sales', [...allSales, newSale]);

        const currentInventory = getItem('inventory') || [];
        const updatedInventory = currentInventory.map(invItem => {
            if (invItem.productId === selectedProductId) {
                return { ...invItem, estoque: invItem.estoque - quantity };
            }
            return invItem;
        });
        setItem('inventory', updatedInventory);

        setLastSale(newSale);
        // Limpa o formulário
        setSelectedProductId('');
        setQuantity(1);
        setPrice(0);
    };

    if (!user) {
        return <Container><p>Carregando...</p></Container>;
    }

    return (
        <Container fluid>
            <Row className="justify-content-center">
                <Col md={8} lg={7}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Anota Aí</Card.Title>
                            <Card.Subtitle className="mb-3 text-muted">
                                Preencha a frase para registrar uma venda rápida.
                            </Card.Subtitle>
                            
                            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                            
                            <Row className="align-items-center g-2">
                                <Col xs="auto" className="pe-0"><span className="h5">Vendi</span></Col>
                                <Col>
                                    <Form.Control 
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="1"
                                    />
                                </Col>
                                <Col xs={5}>
                                    <Form.Select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                                        <option value="">Selecione um produto...</option>
                                        {inventory.map(item => (
                                            <option key={item.productId} value={item.productId}>
                                                {item.nome}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col xs="auto" className="px-0"><span className="h5">por</span></Col>
                                <Col>
                                    <InputGroup>
                                        <InputGroup.Text>R$</InputGroup.Text>
                                        <Form.Control 
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            step="0.01"
                                            min="0"
                                            disabled={!selectedProductId}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col xs="auto" className="ps-1"><span className="h5">a unidade.</span></Col>
                            </Row>

                            <div className="d-grid mt-4">
                                <Button onClick={handleRegisterSale} disabled={!selectedProductId}>Registrar Venda</Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {lastSale && (
                        <Card className="mt-4">
                            <Card.Body>
                                <Card.Title className="text-success">Venda Registrada com Sucesso!</Card.Title>
                                <ListGroup variant="flush">
                                    {lastSale.itens.map(item => {
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