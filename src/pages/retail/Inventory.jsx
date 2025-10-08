// FILE: src/pages/retail/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getInventoryByRetailer, getActorsByType } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { generateId } from '../../utils/ids';
import { Container, Table, Button, Modal, Form, Row, Col, Card, Badge, Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PlusCircleFill, InfoCircleFill, Trash3Fill } from 'react-bootstrap-icons';

// --- COMPONENTE OTIMIZADO ---
const ProductDetailRow = ({ item }) => {
    const details = item.salesDetails; 

    return (
        <tr className="product-details-row">
            <td colSpan="8">
                <Collapse in={!!item.isExpanded}>
                    <div>
                       <Card body className="bg-light border-2 p-3">
                           <Row>
                               <Col md={12} className="mb-3">
                                   <h6 className="text-muted">Lotes Disponíveis</h6>
                                   <Table striped bordered size="sm">
                                       <thead><tr><th>Validade</th><th>Estoque</th><th>Custo (R$)</th></tr></thead>
                                       <tbody>
                                           {item.batches.sort((a,b) => new Date(a.dataValidade) - new Date(b.dataValidade)).map(batch => (
                                               <tr key={batch.id}>
                                                   <td>{new Date(batch.dataValidade).toLocaleDateString('pt-BR')}</td>
                                                   <td>{batch.estoque}</td>
                                                   <td>{batch.custoMedio.toFixed(2)}</td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </Table>
                               </Col>
                               <Col md={4}>
                                   <h6 className="text-muted">Vendas (Últimos 30 dias)</h6>
                                   <p className="h4">{details.salesCount} vendas | {details.quantitySold} un.</p>
                               </Col>
                               <Col md={4}>
                                   <h6 className="text-muted">Performance Financeira</h6>
                                   <p className="mb-0"><small>Preço Médio Venda:</small> R$ {details.averagePrice.toFixed(2)}</p>
                                   <p><small>Lucro Médio/Un:</small> R$ {details.averageProfit.toFixed(2)}</p>
                               </Col>
                               <Col md={4}>
                                   <h6 className="text-muted">Próximo Vencimento</h6>
                                   <p className="h5">{item.nextExpiryDate ? new Date(item.nextExpiryDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                               </Col>
                           </Row>
                       </Card>
                    </div>
                </Collapse>
            </td>
        </tr>
    );
};


const Inventory = () => {
    const { user } = useAuth();
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const [inventoryItems, setInventoryItems] = useState([]);
    const [industries, setIndustries] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [currentItem, setCurrentItem] = useState(null);
    const [editData, setEditData] = useState({});

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        if (user) {
            setInventoryItems(getInventoryByRetailer(user.actorId));
            setIndustries(getActorsByType('industry'));
        }
    }, [user, lastUpdated]);

    const uniqueCategories = useMemo(() => [...new Set(inventoryItems.map(item => item.categoria))].sort(), [inventoryItems]);
    const uniqueBrands = useMemo(() => [...new Set(inventoryItems.map(item => item.marca))].sort(), [inventoryItems]);

    const filteredItems = useMemo(() => {
        return inventoryItems.filter(item => {
            const categoryMatch = categoryFilter === 'all' || item.categoria === categoryFilter;
            const brandMatch = brandFilter === 'all' || item.marca === brandFilter;
            return categoryMatch && brandMatch;
        }).map(item => ({...item, isExpanded: item.productId === expandedRow }));
    }, [inventoryItems, categoryFilter, brandFilter, expandedRow]);
    
    const handleOpenModal = (type, item = null) => {
        setModalType(type);
        setCurrentItem(item);
        if (type === 'ajuste') {
            setEditData({
                nome: item?.nome || '',
                categoria: item?.categoria || '',
                industryId: item?.industryId || '',
                precoVenda: item?.batches[0]?.precoVenda || 0
            });
        }
        if (type === 'entrada') {
            setEditData({
                quantidade: 1,
                custoCompra: item?.avgCost || 0,
                precoVenda: item?.avgPrice || 0,
                dataValidade: ''
            });
        }
        if (type === 'novoProduto') {
            setEditData({ nome: '', sku: '', categoria: '', industryId: '', estoque: 1, custoMedio: '', precoVenda: '', dataValidade: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentItem(null);
        setEditData({});
    };
    
    const handleToggleExpand = (itemId) => {
      setExpandedRow(expandedRow === itemId ? null : itemId);
    };

    const handleSaveChanges = () => {
        if (modalType === 'ajuste') {
            const allProducts = getItem('products') || [];
            const allInventory = getItem('inventory') || [];
            
            const updatedProducts = allProducts.map(p => {
                if (p.id === currentItem.productId) {
                    return {
                        ...p,
                        nome: editData.nome,
                        categoria: editData.categoria,
                        industryId: editData.industryId,
                        marca: industries.find(i => i.id === editData.industryId)?.nomeFantasia || p.marca,
                    };
                }
                return p;
            });
            setItem('products', updatedProducts);
            
            const updatedInventory = allInventory.map(invItem => {
                if (invItem.id === currentItem.batches[0].id) {
                    return { ...invItem, precoVenda: parseFloat(editData.precoVenda) };
                }
                return invItem;
            });
            setItem('inventory', updatedInventory);
        }
        
        if (modalType === 'entrada') {
            const allInventory = getItem('inventory') || [];
            const newInventoryItem = {
                id: generateId(),
                retailerId: user.actorId,
                productId: currentItem.productId,
                sku: currentItem.sku,
                estoque: parseInt(editData.quantidade, 10),
                custoMedio: parseFloat(editData.custoCompra),
                precoVenda: parseFloat(editData.precoVenda),
                dataValidade: new Date(editData.dataValidade).toISOString()
            };
            setItem('inventory', [...allInventory, newInventoryItem]);
        }
        
        setLastUpdated(Date.now());
        handleCloseModal();
    };

    const handleCreateNewProduct = () => {
        const allProducts = getItem('products') || [];
        const allInventory = getItem('inventory') || [];
        const selectedIndustry = industries.find(i => i.id === editData.industryId);

        const newProductId = generateId();
        
        const newProduct = {
            id: newProductId, sku: editData.sku, nome: editData.nome, categoria: editData.categoria,
            subcategoria: 'Geral', marca: selectedIndustry.nomeFantasia, industryId: editData.industryId,
            precoSugerido: parseFloat(editData.precoVenda)
        };
        setItem('products', [...allProducts, newProduct]);

        const newInventoryItem = {
            id: generateId(), retailerId: user.actorId, productId: newProductId, sku: editData.sku,
            estoque: parseInt(editData.estoque, 10), custoMedio: parseFloat(editData.custoMedio),
            precoVenda: parseFloat(editData.precoVenda), dataValidade: new Date(editData.dataValidade).toISOString()
        };
        setItem('inventory', [...allInventory, newInventoryItem]);
        
        setLastUpdated(Date.now());
        handleCloseModal();
    };

    // --- NOVA FUNÇÃO DE EXCLUSÃO ---
    const handleDeleteProduct = () => {
        if (!currentItem) return;

        // Remove o produto da lista de produtos
        const allProducts = getItem('products') || [];
        const updatedProducts = allProducts.filter(p => p.id !== currentItem.productId);
        setItem('products', updatedProducts);

        // Remove todos os lotes (itens de inventário) associados a esse produto
        const allInventory = getItem('inventory') || [];
        const updatedInventory = allInventory.filter(item => item.productId !== currentItem.productId);
        setItem('inventory', updatedInventory);
        
        setLastUpdated(Date.now());
        handleCloseModal();
    };

    const renderModalContent = () => {
        switch(modalType) {
            // --- NOVO MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ---
            case 'excluir':
                return (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title>Confirmar Exclusão</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p>Você tem certeza que deseja excluir o produto <strong>"{currentItem?.nome}"</strong>?</p>
                            <p className="text-danger">Esta ação é irreversível e removerá todos os lotes e o histórico associado a este item do seu estoque.</p>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="danger" onClick={handleDeleteProduct}>Sim, Excluir Produto</Button>
                        </Modal.Footer>
                    </>
                );
            case 'novoProduto':
                return (
                    <>
                        <Modal.Header closeButton><Modal.Title>Cadastrar Novo Produto</Modal.Title></Modal.Header>
                        <Modal.Body>
                             <Form>
                                <Row>
                                    <Col md={8}><Form.Group className="mb-3"><Form.Label>Nome do Produto</Form.Label><Form.Control type="text" value={editData.nome} onChange={e => setEditData({...editData, nome: e.target.value})} /></Form.Group></Col>
                                    <Col md={4}><Form.Group className="mb-3"><Form.Label>SKU</Form.Label><Form.Control type="text" value={editData.sku} onChange={e => setEditData({...editData, sku: e.target.value})} /></Form.Group></Col>
                                </Row>
                                <Row>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Fabricante (Indústria)</Form.Label><Form.Select value={editData.industryId} onChange={e => setEditData({...editData, industryId: e.target.value})}><option value="">Selecione...</option>{industries.map(ind => <option key={ind.id} value={ind.id}>{ind.nomeFantasia}</option>)}</Form.Select></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Categoria</Form.Label><Form.Control type="text" value={editData.categoria} onChange={e => setEditData({...editData, categoria: e.target.value})} /></Form.Group></Col>
                                </Row>
                                <Row>
                                    <Col><Form.Group className="mb-3"><Form.Label>Qtd. Inicial</Form.Label><Form.Control type="number" value={editData.estoque} onChange={e => setEditData({...editData, estoque: e.target.value})} min="0" /></Form.Group></Col>
                                    <Col><Form.Group className="mb-3"><Form.Label>Custo (R$)</Form.Label><Form.Control type="number" value={editData.custoMedio} onChange={e => setEditData({...editData, custoMedio: e.target.value})} min="0" step="0.01" /></Form.Group></Col>
                                    <Col><Form.Group className="mb-3"><Form.Label>Preço Venda (R$)</Form.Label><Form.Control type="number" value={editData.precoVenda} onChange={e => setEditData({...editData, precoVenda: e.target.value})} min="0" step="0.01" /></Form.Group></Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data de Validade</Form.Label>
                                    <Form.Control type="date" value={editData.dataValidade} onChange={e => setEditData({...editData, dataValidade: e.target.value})} />
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
                        <Modal.Header closeButton><Modal.Title>Registrar Novo Lote: {currentItem?.nome}</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                               <Form.Label>Quantidade a Adicionar</Form.Label>
                               <Form.Control type="number" value={editData.quantidade} onChange={e => setEditData({...editData, quantidade: e.target.value})} min="1" autoFocus />
                            </Form.Group>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                       <Form.Label>Custo de Compra (Un.)</Form.Label>
                                       <Form.Control type="number" value={editData.custoCompra} onChange={e => setEditData({...editData, custoCompra: e.target.value})} min="0" step="0.01" />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                       <Form.Label>Preço de Venda (Un.)</Form.Label>
                                       <Form.Control type="number" value={editData.precoVenda} onChange={e => setEditData({...editData, precoVenda: e.target.value})} min="0" step="0.01" />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Data de Validade do Lote</Form.Label>
                                <Form.Control type="date" value={editData.dataValidade} onChange={(e) => setEditData({...editData, dataValidade: e.target.value})} />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveChanges} disabled={!editData.dataValidade}>Salvar Novo Lote</Button>
                        </Modal.Footer>
                    </>
                );
            case 'ajuste':
                return (
                    <>
                        <Modal.Header closeButton><Modal.Title>Ajustar Produto</Modal.Title></Modal.Header>
                        <Modal.Body>
                             <Form.Group className="mb-3"><Form.Label>Nome do Produto</Form.Label><Form.Control type="text" value={editData.nome} onChange={e => setEditData({...editData, nome: e.target.value})} /></Form.Group>
                             <Row>
                                 <Col>
                                    <Form.Group className="mb-3"><Form.Label>Categoria</Form.Label><Form.Control type="text" value={editData.categoria} onChange={e => setEditData({...editData, categoria: e.target.value})} /></Form.Group>
                                 </Col>
                                 <Col>
                                    <Form.Group className="mb-3"><Form.Label>Fabricante</Form.Label><Form.Select value={editData.industryId} onChange={e => setEditData({...editData, industryId: e.target.value})}><option value="">Selecione...</option>{industries.map(ind => <option key={ind.id} value={ind.id}>{ind.nomeFantasia}</option>)}</Form.Select></Form.Group>
                                 </Col>
                             </Row>
                           <Form.Group>
                               <Form.Label>Preço de Venda (Lote Principal)</Form.Label>
                               <Form.Control type="number" value={editData.precoVenda} onChange={e => setEditData({...editData, precoVenda: e.target.value})} min="0" step="0.01" />
                               <Form.Text>Este preço será aplicado ao lote mais antigo em estoque.</Form.Text>
                           </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="primary" onClick={handleSaveChanges}>Salvar Ajustes</Button>
                        </Modal.Footer>
                    </>
                );
            default:
                return null;
        }
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
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Marca</th>
                            <th className="text-center">Estoque Total</th>
                            <th>
                                Preço de Venda{' '}
                                <OverlayTrigger placement="top" overlay={<Tooltip>Preço médio ponderado pelo estoque dos lotes disponíveis.</Tooltip>}>
                                    <InfoCircleFill size={14} className="text-muted" />
                                </OverlayTrigger>
                            </th>
                            <th>Margem Lucro/Un.</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <React.Fragment key={item.productId}>
                                <tr onClick={() => handleToggleExpand(item.productId)} style={{ cursor: 'pointer' }}>
                                    <td><div>{item.nome}<small className="d-block text-muted">{item.sku}</small></div></td>
                                    <td>{item.marca}</td>
                                    <td className="text-center"><Badge bg={item.totalStock < 10 ? "danger" : "primary"} pill className="p-2 fs-6">{item.totalStock}</Badge></td>
                                    <td>R$ {item.avgPrice.toFixed(2)}</td>
                                    <td>R$ {item.profitMargin.toFixed(2)}</td>
                                    <td>
                                        <Button variant="outline-success" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('entrada', item); }}>Entrada</Button>{' '}
                                        <Button variant="outline-warning" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('ajuste', item); }}>Ajustar</Button>{' '}
                                        {/* --- NOVO BOTÃO DE EXCLUIR --- */}
                                        <Button variant="outline-danger" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal('excluir', item); }}>
                                            <Trash3Fill />
                                        </Button>
                                    </td>
                                </tr>
                                {item.isExpanded && <ProductDetailRow item={item} />}
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