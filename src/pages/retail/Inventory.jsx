// FILE: src/pages/retail/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getInventoryByRetailer, getProductDetails, getActorsByType } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { generateId } from '../../utils/ids';
import { Container, Table, Button, Modal, Form, Row, Col, Card, Badge, Collapse } from 'react-bootstrap';
import { PlusCircleFill } from 'react-bootstrap-icons';

const Inventory = () => {
    const { user } = useAuth();

    // --- STATES ---
    const [inventoryItems, setInventoryItems] = useState([]);
    const [industries, setIndustries] = useState([]);
    
    // States for Modals
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'entrada', 'ajusteEstoque', 'ajustePreco', 'novoProduto'
    const [currentItem, setCurrentItem] = useState(null);
    const [adjustmentValue, setAdjustmentValue] = useState(0);
    const [expiryDate, setExpiryDate] = useState(''); // State for expiry date in modals
    const [newProductData, setNewProductData] = useState({ 
        nome: '', sku: '', categoria: '', industryId: '', estoque: 0, custoMedio: 0, precoVenda: 0, dataValidade: '' 
    });

    // States for Filtering and UI
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);

    // --- DATA FETCHING & DERIVED DATA ---
    useEffect(() => {
        if (user) {
            setInventoryItems(getInventoryByRetailer(user.actorId));
            setIndustries(getActorsByType('industry'));
        }
    }, [user]);

    const uniqueCategories = useMemo(() => [...new Set(inventoryItems.map(item => item.categoria))].sort(), [inventoryItems]);
    const uniqueBrands = useMemo(() => [...new Set(inventoryItems.map(item => item.marca))].sort(), [inventoryItems]);

    const filteredItems = useMemo(() => {
        return inventoryItems.filter(item => {
            const categoryMatch = categoryFilter === 'all' || item.categoria === categoryFilter;
            const brandMatch = brandFilter === 'all' || item.marca === brandFilter;
            return categoryMatch && brandMatch;
        });
    }, [inventoryItems, categoryFilter, brandFilter]);
    
    // --- MODAL HANDLERS ---
    const handleOpenModal = (type, item = null) => {
        setModalType(type);
        setCurrentItem(item);
        if (type === 'ajusteEstoque') setAdjustmentValue(item?.estoque || 0);
        if (type === 'ajustePreco') setAdjustmentValue(item?.precoVenda || 0);
        if (type === 'entrada') {
            setAdjustmentValue(0);
            setExpiryDate(''); // Reset expiry date for new entry
        }
        if (type === 'novoProduto') {
            setNewProductData({ nome: '', sku: '', categoria: '', industryId: '', estoque: 1, custoMedio: '', precoVenda: '', dataValidade: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentItem(null);
    };
    
    const handleToggleExpand = (itemId) => {
      setExpandedRow(expandedRow === itemId ? null : itemId);
    };

    // --- CRUD OPERATIONS ---
    const handleSaveChanges = () => {
        const allInventory = getItem('inventory') || [];
        let updatedInventory;

        if (modalType === 'ajustePreco' || modalType === 'ajusteEstoque' || modalType === 'entrada') {
            updatedInventory = allInventory.map(invItem => {
                if (invItem.id === currentItem.id) {
                    const newValue = parseFloat(adjustmentValue);
                    if (modalType === 'entrada') {
                        return { 
                            ...invItem, 
                            estoque: invItem.estoque + newValue,
                            dataValidade: new Date(expiryDate).toISOString() // Atualiza a data de validade na entrada
                        };
                    }
                    if (modalType === 'ajusteEstoque') return { ...invItem, estoque: newValue };
                    if (modalType === 'ajustePreco') return { ...invItem, precoVenda: newValue };
                }
                return invItem;
            });
        }
        
        setItem('inventory', updatedInventory);
        setInventoryItems(getInventoryByRetailer(user.actorId));
        handleCloseModal();
    };

    const handleCreateNewProduct = () => {
        const allProducts = getItem('products') || [];
        const allInventory = getItem('inventory') || [];
        const selectedIndustry = industries.find(i => i.id === newProductData.industryId);

        const newProductId = generateId();
        
        const newProduct = {
            id: newProductId,
            sku: newProductData.sku,
            nome: newProductData.nome,
            categoria: newProductData.categoria,
            subcategoria: 'Geral',
            marca: selectedIndustry.nomeFantasia,
            industryId: newProductData.industryId,
            precoSugerido: parseFloat(newProductData.precoVenda)
        };
        setItem('products', [...allProducts, newProduct]);

        const newInventoryItem = {
            id: generateId(),
            retailerId: user.actorId,
            productId: newProductId,
            sku: newProductData.sku,
            estoque: parseInt(newProductData.estoque, 10),
            custoMedio: parseFloat(newProductData.custoMedio),
            precoVenda: parseFloat(newProductData.precoVenda),
            dataValidade: new Date(newProductData.dataValidade).toISOString() // Salva a data de validade
        };
        setItem('inventory', [...allInventory, newInventoryItem]);
        
        setInventoryItems(getInventoryByRetailer(user.actorId));
        handleCloseModal();
    };

    const renderModalContent = () => {
        switch(modalType) {
            case 'novoProduto':
                return (
                    <>
                        <Modal.Header closeButton><Modal.Title>Cadastrar Novo Produto</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Row>
                                    <Col md={8}><Form.Group className="mb-3"><Form.Label>Nome do Produto</Form.Label><Form.Control type="text" value={newProductData.nome} onChange={e => setNewProductData({...newProductData, nome: e.target.value})} /></Form.Group></Col>
                                    <Col md={4}><Form.Group className="mb-3"><Form.Label>SKU</Form.Label><Form.Control type="text" value={newProductData.sku} onChange={e => setNewProductData({...newProductData, sku: e.target.value})} /></Form.Group></Col>
                                </Row>
                                <Row>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Marca (Indústria)</Form.Label><Form.Select value={newProductData.industryId} onChange={e => setNewProductData({...newProductData, industryId: e.target.value})}><option value="">Selecione...</option>{industries.map(ind => <option key={ind.id} value={ind.id}>{ind.nomeFantasia}</option>)}</Form.Select></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Categoria</Form.Label><Form.Select value={newProductData.categoria} onChange={e => setNewProductData({...newProductData, categoria: e.target.value})}><option value="">Selecione...</option>{uniqueCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</Form.Select></Form.Group></Col>
                                </Row>
                                <Row>
                                    <Col><Form.Group className="mb-3"><Form.Label>Qtd. Inicial</Form.Label><Form.Control type="number" value={newProductData.estoque} onChange={e => setNewProductData({...newProductData, estoque: e.target.value})} min="0" /></Form.Group></Col>
                                    <Col><Form.Group className="mb-3"><Form.Label>Preço Compra (R$)</Form.Label><Form.Control type="number" value={newProductData.custoMedio} onChange={e => setNewProductData({...newProductData, custoMedio: e.target.value})} min="0" step="0.01" /></Form.Group></Col>
                                    <Col><Form.Group className="mb-3"><Form.Label>Preço Venda (R$)</Form.Label><Form.Control type="number" value={newProductData.precoVenda} onChange={e => setNewProductData({...newProductData, precoVenda: e.target.value})} min="0" step="0.01" /></Form.Group></Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data de Validade</Form.Label>
                                    <Form.Control type="date" value={newProductData.dataValidade} onChange={e => setNewProductData({...newProductData, dataValidade: e.target.value})} />
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="primary" onClick={handleCreateNewProduct}>Salvar Produto</Button>
                        </Modal.Footer>
                    </>
                );
            case 'entrada':
                return (
                     <>
                        <Modal.Header closeButton><Modal.Title>Registrar Entrada de {currentItem?.nome}</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <p>Estoque Atual: <strong>{currentItem?.estoque}</strong></p>
                            <Form.Group className="mb-3">
                               <Form.Label>Quantidade a Adicionar</Form.Label>
                               <Form.Control type="number" value={adjustmentValue} onChange={e => setAdjustmentValue(e.target.value)} min="0" autoFocus />
                            </Form.Group>
                            {/* CAMPO DE VALIDADE ADICIONADO À ENTRADA */}
                            <Form.Group className="mb-3">
                                <Form.Label>Data de Validade do Lote</Form.Label>
                                <Form.Control type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveChanges} disabled={!expiryDate}>Salvar Alterações</Button>
                        </Modal.Footer>
                    </>
                );
            case 'ajustePreco':
                return (
                    <>
                        <Modal.Header closeButton><Modal.Title>Ajustar Preço de Venda</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <p><strong>{currentItem?.nome}</strong></p>
                            <Form.Group><Form.Label>Novo Preço de Venda (R$)</Form.Label><Form.Control type="number" value={adjustmentValue} onChange={e => setAdjustmentValue(e.target.value)} min="0" step="0.01" autoFocus /></Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveChanges}>Salvar Novo Preço</Button>
                        </Modal.Footer>
                    </>
                );
            case 'ajusteEstoque':
                return (
                    <>
                        <Modal.Header closeButton><Modal.Title>Ajustar Estoque de {currentItem?.nome}</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <p>Estoque Atual: <strong>{currentItem?.estoque}</strong></p>
                            <Form.Group><Form.Label>Novo Valor do Estoque</Form.Label><Form.Control type="number" value={adjustmentValue} onChange={e => setAdjustmentValue(e.target.value)} min="0" autoFocus /></Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveChanges}>Salvar Alterações</Button>
                        </Modal.Footer>
                    </>
                );
            default:
                return null;
        }
    };
    
    const ProductDetailRow = ({ item }) => {
        const details = useMemo(() => getProductDetails(user.actorId, item.productId), [user, item.productId]);
        
        return (
            <tr className="product-details-row">
                <td colSpan="8">
                    <Collapse in={expandedRow === item.id}>
                        <div>
                           <Card body className="bg-light border-2">
                               <Row>
                                   <Col md={4}>
                                       <h6 className="text-muted">Vendas (Últimos 30 dias)</h6>
                                       <p className="h4">{details.salesCount} vendas | {details.quantitySold} un.</p>
                                   </Col>
                                   <Col md={4}>
                                       <h6 className="text-muted">Performance Financeira</h6>
                                       <p className="mb-0"><small>Preço Médio:</small> R$ {details.averagePrice.toFixed(2)}</p>
                                       <p><small>Lucro Médio/Un:</small> R$ {details.averageProfit.toFixed(2)}</p>
                                   </Col>
                                   <Col md={4}>
                                       <h6 className="text-muted">Próximo Vencimento</h6>
                                       <p className="h5">{item.dataValidade ? new Date(item.dataValidade).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                   </Col>
                               </Row>
                           </Card>
                        </div>
                    </Collapse>
                </td>
            </tr>
        )
    };

    if (!user) return <div>Carregando...</div>;

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-3">
                 <h1 className="h3 mb-0">Gestão de Estoque</h1>
                 <Button variant="primary" onClick={() => handleOpenModal('novoProduto')}>
                     <PlusCircleFill className="me-2"/>
                     Cadastrar Novo Produto
                 </Button>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-end">
                        <Col md={4}><Form.Group><Form.Label>Filtrar por Categoria</Form.Label><Form.Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">Todas as Categorias</option>{uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</Form.Select></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label>Filtrar por Marca</Form.Label><Form.Select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}><option value="all">Todas as Marcas</option>{uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}</Form.Select></Form.Group></Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card>
                <Table striped hover responsive className="mb-0 align-middle">
                    <thead><tr><th>Produto</th><th>Marca</th><th className="text-center">Estoque</th><th>Preço Venda</th><th>Ações</th></tr></thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <React.Fragment key={item.id}>
                                <tr onClick={() => handleToggleExpand(item.id)} style={{ cursor: 'pointer' }}>
                                    <td><div>{item.nome}<small className="d-block text-muted">{item.sku}</small></div></td>
                                    <td>{item.marca}</td>
                                    <td className="text-center"><Badge bg={item.estoque < 10 ? "danger" : "primary"} pill className="p-2 fs-6">{item.estoque}</Badge></td>
                                    <td>R$ {item.precoVenda?.toFixed(2)}</td>
                                    <td>
                                        <Button variant="outline-success" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('entrada', item); }}>Entrada</Button>{' '}
                                        <Button variant="outline-warning" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('ajusteEstoque', item); }}>Ajuste</Button>{' '}
                                        <Button variant="outline-info" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('ajustePreco', item); }}>Preço</Button>
                                    </td>
                                </tr>
                                <ProductDetailRow item={item} />
                           </React.Fragment>
                        ))}
                    </tbody>
                </Table>
            </Card>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                {renderModalContent()}
            </Modal>
        </Container>
    );
};

export default Inventory;