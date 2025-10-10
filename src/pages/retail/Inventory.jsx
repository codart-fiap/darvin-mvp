// FILE: src/pages/retail/Inventory.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getInventoryByRetailer } from '../../state/selectors.js';
import { getItem, setItem } from '../../state/storage.js';
import { generateId } from '../../utils/ids.js';
import {
    Container, Row, Col, Card, Table, Button, Form,
    Modal, Alert, Badge, InputGroup
} from 'react-bootstrap';
import {
    Search, Plus, PencilSquare, Trash,
    ExclamationTriangle, CheckCircle,
    XCircle
} from 'react-bootstrap-icons';

const Inventory = () => {
    const { user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
    const [selectedItem, setSelectedItem] = useState(null); // Para edição/exclusão única
    const [selectedProducts, setSelectedProducts] = useState(new Set()); // Para seleção múltipla

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');

    const [formData, setFormData] = useState({
        nome: '',
        sku: '',
        categoria: 'Alimentos',
        marca: '',
        estoque: 0,
        custoMedio: 0,
        precoVenda: 0,
        dataValidade: ''
    });

    const [formErrors, setFormErrors] = useState({});
    
    // Recarregar o inventário quando uma venda é finalizada
    const [lastUpdated, setLastUpdated] = useState(Date.now());


    useEffect(() => {
        if (user) {
            loadInventory();
        }
    }, [user, lastUpdated]);

    const loadInventory = () => {
        const data = getInventoryByRetailer(user.actorId);
        setInventory(data);
        setSelectedProducts(new Set());
    };

    // Filtros e busca
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = !searchTerm ||
                item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.marca.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = categoryFilter === 'all' || item.categoria === categoryFilter;

            let matchesStock = true;
            if (stockFilter === 'low') matchesStock = item.totalStock > 0 && item.totalStock <= 10;
            else if (stockFilter === 'out') matchesStock = item.totalStock === 0;
            else if (stockFilter === 'ok') matchesStock = item.totalStock > 10;
            
            // Note: A lógica de 'source' (origem) não está nos dados, então foi removida.
            // Se precisar, adicione uma propriedade 'origem' aos seus dados de inventário.
            // let matchesSource = true;
            // if (sourceFilter === 'imported') matchesSource = item.marca === 'Importado';
            // else if (sourceFilter === 'native') matchesSource = item.marca !== 'Importado';

            return matchesSearch && matchesCategory && matchesStock;
        });
    }, [inventory, searchTerm, categoryFilter, stockFilter, sourceFilter]);

    // Estatísticas
    const stats = useMemo(() => {
        const totalProducts = inventory.length;
        const totalValue = inventory.reduce((sum, item) => sum + (item.avgPrice * item.totalStock), 0);
        const totalCost = inventory.reduce((sum, item) => sum + (item.avgCost * item.totalStock), 0);
        const lowStock = inventory.filter(item => item.totalStock > 0 && item.totalStock <= 10).length;
        const outOfStock = inventory.filter(item => item.totalStock === 0).length;

        return { totalProducts, totalValue, totalCost, lowStock, outOfStock };
    }, [inventory]);

    // Categorias únicas
    const categories = useMemo(() => {
        return [...new Set(inventory.map(item => item.categoria))].sort();
    }, [inventory]);

    // Funções de Seleção Múltipla
    const toggleSelect = (productId) => {
        const newSelection = new Set(selectedProducts);
        if (newSelection.has(productId)) {
            newSelection.delete(productId);
        } else {
            newSelection.add(productId);
        }
        setSelectedProducts(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedProducts.size === filteredInventory.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredInventory.map(item => item.productId)));
        }
    };
    
    // Abrir modal para criar
    const handleCreate = () => {
        setModalMode('create');
        setFormData({
            nome: '',
            sku: `SKU-${Date.now()}`,
            categoria: 'Alimentos',
            marca: '',
            estoque: 0,
            custoMedio: 0,
            precoVenda: 0,
            dataValidade: ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (item) => {
        setModalMode('edit');
        setSelectedItem(item);
        // Popula o formulário com os dados do item. Pega os valores do primeiro lote como base.
        setFormData({
            nome: item.nome,
            sku: item.sku,
            categoria: item.categoria,
            marca: item.marca,
            estoque: item.totalStock,
            custoMedio: item.avgCost,
            precoVenda: item.avgPrice,
            dataValidade: item.nextExpiryDate ? item.nextExpiryDate.split('T')[0] : ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    // Função centralizada para atualizar o formulário
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Validação do formulário
    const validateForm = () => {
        const errors = {};

        if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
        if (!formData.sku.trim()) errors.sku = 'SKU é obrigatório';
        if (!formData.marca.trim()) errors.marca = 'Marca é obrigatória';
        if (formData.estoque < 0) errors.estoque = 'Estoque não pode ser negativo';
        if (formData.custoMedio < 0) errors.custoMedio = 'Custo não pode ser negativo';
        if (formData.precoVenda <= 0) errors.precoVenda = 'Preço de venda deve ser maior que zero';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Salvar (criar ou editar)
    const handleSave = () => {
        if (!validateForm()) return;
        
        const skuExists = inventory.some(item => 
            item.sku === formData.sku && 
            (modalMode === 'create' || item.productId !== selectedItem.productId)
        );

        if (skuExists) {
            setFormErrors(prev => ({ ...prev, sku: 'Este SKU já está em uso.' }));
            return;
        }

        try {
            const allProducts = getItem('products') || [];
            const allInventory = getItem('inventory') || [];

            if (modalMode === 'create') {
                const newProductId = generateId();
                const newProduct = {
                    id: newProductId, sku: formData.sku, nome: formData.nome, categoria: formData.categoria,
                    subcategoria: 'Geral', industryId: 'manual', precoSugerido: parseFloat(formData.precoVenda),
                    marca: formData.marca
                };
                
                const validade = formData.dataValidade
                    ? new Date(formData.dataValidade).toISOString()
                    : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

                const newInventoryItem = {
                    id: generateId(), retailerId: user.actorId, productId: newProductId, 
                    sku: formData.sku, nome: formData.nome,
                    estoque: parseInt(formData.estoque, 10), custoMedio: parseFloat(formData.custoMedio),
                    precoVenda: parseFloat(formData.precoVenda), dataValidade: validade
                };

                setItem('products', [...allProducts, newProduct]);
                setItem('inventory', [...allInventory, newInventoryItem]);

            } else { // Modo 'edit'
                const updatedProducts = allProducts.map(p => 
                    p.id === selectedItem.productId 
                        ? { ...p, nome: formData.nome, sku: formData.sku, marca: formData.marca, categoria: formData.categoria, precoSugerido: parseFloat(formData.precoVenda) } 
                        : p
                );

                const validade = formData.dataValidade
                    ? new Date(formData.dataValidade).toISOString()
                    : selectedItem.nextExpiryDate;
                
                // Na edição, atualizamos o lote mais antigo
                const firstBatchId = selectedItem.batches.sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade))[0]?.id;

                const updatedInventory = allInventory.map(inv => {
                    if (inv.productId === selectedItem.productId) {
                        const baseUpdate = { ...inv, nome: formData.nome, sku: formData.sku, categoria: formData.categoria, marca: formData.marca };
                        if (inv.id === firstBatchId) {
                            return { 
                                ...baseUpdate, 
                                estoque: parseInt(formData.estoque, 10), 
                                custoMedio: parseFloat(formData.custoMedio),
                                precoVenda: parseFloat(formData.precoVenda),
                                dataValidade: validade
                            };
                        }
                        return baseUpdate;
                    }
                    return inv;
                });
                
                setItem('products', updatedProducts);
                setItem('inventory', updatedInventory);
            }

            setShowModal(false);
            setLastUpdated(Date.now());
            alert(modalMode === 'create' ? 'Produto cadastrado!' : 'Produto atualizado!');

        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto.');
        }
    };
    
    // Abrir modal de exclusão
    const handleDelete = (item = null) => {
        if (item) {
            setSelectedProducts(new Set([item.productId]));
        }
        setShowDeleteModal(true);
    };
    
    // Confirmar exclusão
    const confirmDelete = () => {
        try {
            const allProducts = getItem('products') || [];
            const allInventory = getItem('inventory') || [];

            const updatedProducts = allProducts.filter(p => !selectedProducts.has(p.id));
            const updatedInventory = allInventory.filter(inv => !selectedProducts.has(inv.productId));
            
            setItem('products', updatedProducts);
            setItem('inventory', updatedInventory);
            
            setShowDeleteModal(false);
            setLastUpdated(Date.now());
            alert(`${selectedProducts.size} produto(s) excluído(s).`);
            
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir.');
        }
    };

    // Calcular margem de lucro
    const calculateMargin = () => {
        const custo = parseFloat(formData.custoMedio) || 0;
        const preco = parseFloat(formData.precoVenda) || 0;
        if (preco === 0) return 0; // Evitar divisão por zero se o preço for 0
        return (((preco - custo) / preco) * 100).toFixed(2);
    };

    // Status do estoque
    const getStockStatus = (stock) => {
        if (stock === 0) return { variant: 'danger', text: 'Sem estoque', icon: <ExclamationTriangle /> };
        if (stock <= 10) return { variant: 'warning', text: 'Estoque baixo', icon: <ExclamationTriangle /> };
        return { variant: 'success', text: 'OK', icon: <CheckCircle /> };
    };

    if (!user) {
        return <Container><p>Carregando...</p></Container>;
    }

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Gestão de Estoque</h1>
                    <p className="text-muted mb-0">Gerencie seus produtos, estoques e preços</p>
                </div>
                <div>
                    {selectedProducts.size > 0 && (
                         <Button variant="danger" className="me-2" onClick={() => handleDelete()}>
                            <Trash size={16} className="me-2" />
                            Excluir ({selectedProducts.size})
                        </Button>
                    )}
                    <Button variant="primary" onClick={handleCreate}>
                        <Plus size={20} className="me-2" />
                        Novo Produto
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <Row className="mb-4">
                 <Col md={6} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Total de Produtos</p>
                            <h4 className="mb-0">{stats.totalProducts}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Valor do Estoque</p>
                            <h4 className="mb-0 text-success">R$ {stats.totalValue.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Custo do Estoque</p>
                            <h4 className="mb-0 text-primary">R$ {stats.totalCost.toFixed(2)}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Estoque Baixo</p>
                            <h4 className="mb-0 text-warning">{stats.lowStock}</h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} lg>
                    <Card className="text-center">
                        <Card.Body>
                            <p className="text-muted small mb-1">Sem Estoque</p>
                            <h4 className="mb-0 text-danger">{stats.outOfStock}</h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filtros */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text><Search /></InputGroup.Text>
                                <Form.Control
                                    placeholder="Buscar por nome, SKU ou marca..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="all">Todas as Categorias</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                             <Form.Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                                <option value="all">Todos os Estoques</option>
                                <option value="ok">Estoque OK</option>
                                <option value="low">Estoque Baixo</option>
                                <option value="out">Sem Estoque</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                                <option value="all">Todas as Origens</option>
                                <option value="native">Cadastro Manual</option>
                                <option value="imported">Importado via Planilha</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Tabela de Produtos */}
            <Card>
                <Card.Body className="p-0">
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <Table hover responsive className="mb-0 align-middle">
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <Form.Check 
                                            type="checkbox"
                                            checked={filteredInventory.length > 0 && selectedProducts.size === filteredInventory.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>Produto</th>
                                    <th>SKU</th>
                                    <th>Categoria</th>
                                    <th>Marca</th>
                                    <th className="text-center">Estoque</th>
                                    <th className="text-end">Custo</th>
                                    <th className="text-end">Preço</th>
                                    <th className="text-end">Margem</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length === 0 ? (
                                    <tr><td colSpan="11" className="text-center text-muted py-4">Nenhum produto encontrado</td></tr>
                                ) : (
                                    filteredInventory.map(item => {
                                        const margin = item.avgPrice > 0
                                            ? (((item.avgPrice - item.avgCost) / item.avgPrice) * 100).toFixed(1)
                                            : 0;
                                        const status = getStockStatus(item.totalStock);

                                        return (
                                            <tr key={item.productId} className={selectedProducts.has(item.productId) ? 'table-primary' : ''}>
                                                <td>
                                                    <Form.Check 
                                                        type="checkbox"
                                                        checked={selectedProducts.has(item.productId)}
                                                        onChange={() => toggleSelect(item.productId)}
                                                    />
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="fw-semibold">{item.nome}</div>
                                                        {item.nextExpiryDate && (<small className="text-muted">Val: {new Date(item.nextExpiryDate).toLocaleDateString('pt-BR')}</small>)}
                                                    </div>
                                                </td>
                                                <td><small className="font-monospace">{item.sku}</small></td>
                                                <td><Badge bg="secondary">{item.categoria}</Badge></td>
                                                <td>{item.marca}</td>
                                                <td className="text-center"><span className={item.totalStock <= 10 ? 'fw-bold' : ''}>{item.totalStock}</span></td>
                                                <td className="text-end">R$ {item.avgCost.toFixed(2)}</td>
                                                <td className="text-end fw-bold">R$ {item.avgPrice.toFixed(2)}</td>
                                                <td className="text-end">{margin}%</td>
                                                <td className="text-center">
                                                    <Badge bg={status.variant} className="d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.75rem' }}>
                                                        {status.icon} {status.text}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(item)}><PencilSquare size={14} /></Button>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item)}><Trash size={14} /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Modal de Criar/Editar */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                 <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'create' ? 'Cadastrar Novo Produto' : 'Editar Produto'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nome do Produto *</Form.Label>
                                    <Form.Control type="text" name="nome" value={formData.nome} onChange={handleFormChange} isInvalid={!!formErrors.nome}/>
                                    <Form.Control.Feedback type="invalid">{formErrors.nome}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>SKU *</Form.Label>
                                    <Form.Control type="text" name="sku" value={formData.sku} onChange={handleFormChange} isInvalid={!!formErrors.sku} />
                                    <Form.Control.Feedback type="invalid">{formErrors.sku}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Categoria *</Form.Label>
                                    <Form.Select name="categoria" value={formData.categoria} onChange={handleFormChange}>
                                        <option value="Alimentos">Alimentos</option> <option value="Bebidas">Bebidas</option>
                                        <option value="Limpeza">Limpeza</option> <option value="Higiene">Higiene</option>
                                        <option value="Outros">Outros</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Marca *</Form.Label>
                                    <Form.Control type="text" name="marca" value={formData.marca} onChange={handleFormChange} isInvalid={!!formErrors.marca} placeholder="Ex: Coca-Cola, Nestlé..."/>
                                    <Form.Control.Feedback type="invalid">{formErrors.marca}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Estoque Atual *</Form.Label>
                                    <Form.Control type="number" name="estoque" value={formData.estoque} onChange={handleFormChange} min="0" isInvalid={!!formErrors.estoque}/>
                                    <Form.Control.Feedback type="invalid">{formErrors.estoque}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Custo Médio (R$) *</Form.Label>
                                    <Form.Control type="number" step="0.01" name="custoMedio" value={formData.custoMedio} onChange={handleFormChange} min="0" isInvalid={!!formErrors.custoMedio}/>
                                    <Form.Control.Feedback type="invalid">{formErrors.custoMedio}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                             <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Preço de Venda (R$) *</Form.Label>
                                    <Form.Control type="number" step="0.01" name="precoVenda" value={formData.precoVenda} onChange={handleFormChange} min="0" isInvalid={!!formErrors.precoVenda}/>
                                    <Form.Control.Feedback type="invalid">{formErrors.precoVenda}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data de Validade</Form.Label>
                                    <Form.Control type="date" name="dataValidade" value={formData.dataValidade} onChange={handleFormChange}/>
                                    <Form.Text className="text-muted">Opcional - deixe em branco se não aplicável</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                 <Form.Group className="mb-3">
                                    <Form.Label>Margem de Lucro</Form.Label>
                                    <Form.Control type="text" value={`${calculateMargin()}%`} disabled/>
                                    <Form.Text className="text-muted">Calculado sobre o preço de venda</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Alert variant="info" className="mb-0">
                            <small><strong>Dica:</strong> A margem de lucro é calculada como: ((Preço de Venda - Custo) / Preço de Venda) × 100</small>
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave}>{modalMode === 'create' ? 'Cadastrar' : 'Salvar Alterações'}</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Exclusão */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger" className="mb-3">
                        <strong>⚠️ Atenção!</strong> Esta ação não pode ser desfeita.
                    </Alert>
                    <p>
                        Você está prestes a excluir <strong>{selectedProducts.size}</strong> produto(s).
                        Tem certeza que deseja continuar?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmDelete}><Trash className="me-2" />Sim, Excluir</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Inventory;