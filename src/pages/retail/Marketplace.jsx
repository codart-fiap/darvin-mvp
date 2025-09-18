// FILE: src/pages/retail/Marketplace.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { searchMarketplace, getProductsForMarketplace, getFeaturedSuppliers } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { generateId } from '../../utils/ids';
import { Container, Table, Button, Modal, Form, InputGroup, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { Search, CupStraw, EggFried, Trash, DropletHalf, Shop } from 'react-bootstrap-icons';

// --- SUB-COMPONENTES PARA ORGANIZAÇÃO ---

// Componente para a Vitrine Inicial
const InitialView = ({ initialData, onSearch }) => {
    const categoryIcons = {
        'Bebidas': <CupStraw className="icon" />, 'Alimentos': <EggFried className="icon" />,
        'Limpeza': <Trash className="icon" />, 'Higiene': <DropletHalf className="icon" />
    };

    return (
        <>
            <h5 className="mb-3">Navegue por Categorias</h5>
            <Row className="mb-5">
                {initialData.categories.map(category => (
                    <Col md={3} key={category} className="mb-3">
                        <Card className="category-card" onClick={() => onSearch(category)}>
                            {categoryIcons[category] || <Shop className="icon" />}
                            <h6 className="mb-0">{category}</h6>
                        </Card>
                    </Col>
                ))}
            </Row>
            <h5 className="mb-3">Fornecedores em Destaque</h5>
            <Row>
                {initialData.suppliers.map(supplier => (
                     <Col md={4} key={supplier.id} className="mb-3">
                         <Card className="supplier-card" onClick={() => onSearch(supplier.nomeFantasia)}>
                             <h6 className="mb-0">{supplier.nomeFantasia}</h6>
                             <small className="text-muted">{supplier.linhaAtuacao}</small>
                        </Card>
                     </Col>
                ))}
            </Row>
        </>
    );
};

// Sub-componente para renderizar o catálogo de um fornecedor
const SupplierResults = ({ results, addToCart }) => (
    <Card>
        <Card.Header as="h5">Catálogo de: {results.supplierName}</Card.Header>
        <Card.Body>
            <Table striped hover responsive>
                <thead><tr><th>Produto</th><th>SKU</th><th>Preço</th><th>Ação</th></tr></thead>
                <tbody>
                    {results.data.map(product => (
                        <tr key={product.id}>
                            <td>{product.nome}</td>
                            <td>{product.sku}</td>
                            <td>R$ {product.precoSugerido.toFixed(2)}</td>
                            <td><Button size="sm" onClick={() => addToCart(product, { id: results.supplierName, name: results.supplierName })}>Adicionar</Button></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card.Body>
    </Card>
);

// Sub-componente para renderizar a busca por produtos
const ProductResults = ({ results, addToCart }) => (
    <Row>
        {results.data.length === 0 && <Col><Card body><p className="text-muted mb-0">Nenhum produto encontrado com este termo.</p></Card></Col>}
        {results.data.map(product => (
            <Col md={12} key={product.id} className="mb-3">
                <Card>
                    <Card.Header>
                        <span className="fw-bold">{product.nome}</span>
                        <Badge pill bg="secondary" className="ms-2">{product.sku}</Badge>
                    </Card.Header>
                    <Card.Body>
                        <Card.Title as="h6">Fornecedores:</Card.Title>
                        <Table responsive borderless size="sm" className="mb-0">
                            <tbody>
                                {product.suppliers.map(supplier => (
                                    <tr key={supplier.id}>
                                        <td>{supplier.name}</td>
                                        <td className="fw-bold">R$ {supplier.price.toFixed(2)}</td>
                                        <td className="text-end">
                                            <Button size="sm" onClick={() => addToCart(product, supplier)}>Adicionar</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Col>
        ))}
    </Row>
);


// --- COMPONENTE PRINCIPAL ---
const Marketplace = () => {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState({ type: 'initial', data: [] });
    const [initialData, setInitialData] = useState({ categories: [], suppliers: [] });

    useEffect(() => {
        const allProducts = getProductsForMarketplace();
        const uniqueCategories = [...new Set(allProducts.map(p => p.categoria))];
        const featuredSuppliers = getFeaturedSuppliers();
        setInitialData({ categories: uniqueCategories, suppliers: featuredSuppliers });
    }, []);

    const handleSearch = (term) => {
        const results = searchMarketplace(term);
        setSearchTerm(term); // Atualiza o termo de busca no input
        setSearchResults(results);
    };
    
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(searchTerm); };

    const addToCart = (product, supplier) => {
        const cartId = `${product.id}-${supplier.id}`;
        const existingItem = cart.find(item => item.cartId === cartId);
        
        if (existingItem) {
            setCart(cart.map(item => item.cartId === cartId ? { ...item, qtde: item.qtde + 1 } : item));
        } else {
            setCart([...cart, { ...product, qtde: 1, cartId, supplierName: supplier.name }]);
        }
    };
    
    const handleFinalizePurchase = () => {
        if (cart.length === 0) return;
        const allInventory = getItem('inventory') || [];
        const updatedInventory = [...allInventory];
        cart.forEach(cartItem => {
            const existingInventoryItem = updatedInventory.find(invItem => invItem.productId === cartItem.id);
            if (existingInventoryItem) {
                existingInventoryItem.estoque += cartItem.qtde;
            } else {
                const validade = new Date();
                validade.setDate(validade.getDate() + 90);
                updatedInventory.push({
                    id: generateId(), retailerId: user.actorId, productId: cartItem.id,
                    estoque: cartItem.qtde, custoMedio: cartItem.precoSugerido,
                    precoVenda: +(cartItem.precoSugerido * 1.25).toFixed(2),
                    dataValidade: validade.toISOString()
                });
            }
        });
        setItem('inventory', updatedInventory);
        setCart([]);
        setShowModal(false);
        setSuccess(`Compra simulada com sucesso! ${cart.length} tipo(s) de item foram adicionados ao seu estoque.`);
    };
    
    return (
        <Container fluid>
            <h1 className="h3 mb-3">Marketplace de Fornecedores</h1>
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Row className="mb-3">
                <Col md={8}>
                    <InputGroup>
                        <Form.Control
                            placeholder="Buscar por produto ou fornecedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <Button onClick={() => handleSearch(searchTerm)}><Search /> Buscar</Button>
                    </InputGroup>
                </Col>
                <Col md={4} className="d-flex justify-content-end">
                    <Button onClick={() => setShowModal(true)} disabled={cart.length === 0} variant="success">
                        Carrinho ({cart.reduce((acc, item) => acc + item.qtde, 0)})
                    </Button>
                </Col>
            </Row>
            <hr />

            {searchResults.type === 'initial' && <InitialView initialData={initialData} onSearch={handleSearch} />}
            {searchResults.type === 'supplier' && <SupplierResults results={searchResults} addToCart={addToCart} />}
            {searchResults.type === 'product' && <ProductResults results={searchResults} addToCart={addToCart} />}

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Carrinho de Compras</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Table>
                        <thead><tr><th>Produto</th><th>Fornecedor</th><th>Qtd</th><th>Subtotal</th></tr></thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.cartId}>
                                    <td>{item.nome}</td>
                                    <td><small>{item.supplierName}</small></td>
                                    <td>{item.qtde}</td>
                                    <td>R$ {(item.precoSugerido * item.qtde).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <h4 className="text-end">
                        Total: R$ {cart.reduce((acc, item) => acc + (item.precoSugerido * item.qtde), 0).toFixed(2)}
                    </h4>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Continuar Comprando</Button>
                    <Button variant="primary" onClick={handleFinalizePurchase}>Finalizar Compra</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Marketplace;