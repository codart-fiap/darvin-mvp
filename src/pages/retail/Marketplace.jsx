// --- ARQUIVO: src/pages/retail/Marketplace.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este é um componente mais complexo que representa a tela do Marketplace,
// onde o varejista pode buscar produtos e fornecedores para comprar e abastecer seu estoque.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { searchMarketplace, getProductsForMarketplace, getFeaturedSuppliers } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { generateId } from '../../utils/ids';
import { Container, Table, Button, Modal, Form, InputGroup, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { Search, CupStraw, EggFried, Trash, DropletHalf, Shop } from 'react-bootstrap-icons';

// --- SUB-COMPONENTES PARA ORGANIZAÇÃO ---
// Dividir a UI em componentes menores torna o código mais fácil de ler e gerenciar.

// Componente para a Vitrine Inicial (o que aparece antes de qualquer busca).
const InitialView = ({ initialData, onSearch }) => {
    // Um objeto para mapear nomes de categorias a seus ícones.
    const categoryIcons = {
        'Bebidas': <CupStraw className="icon" />, 'Alimentos': <EggFried className="icon" />,
        'Limpeza': <Trash className="icon" />, 'Higiene': <DropletHalf className="icon" />
    };

    return (
        // `<>` é um Fragment, usado para agrupar elementos sem criar um `div` extra no HTML.
        <>
            <h5 className="mb-3">Navegue por Categorias</h5>
            <Row className="mb-5">
                {/* Mapeia as categorias para criar um Card para cada uma. */}
                {initialData.categories.map(category => (
                    <Col md={3} key={category} className="mb-3">
                        <Card className="category-card" onClick={() => onSearch(category)}>
                            {/* Pega o ícone do objeto, ou usa um ícone padrão se não encontrar. */}
                            {categoryIcons[category] || <Shop className="icon" />}
                            <h6 className="mb-0">{category}</h6>
                        </Card>
                    </Col>
                ))}
            </Row>
            <h5 className="mb-3">Fornecedores em Destaque</h5>
            <Row>
                {/* Mapeia os fornecedores para criar um Card para cada um. */}
                {initialData.suppliers.map(supplier => (
                     <Col md={4} key={supplier.id} className="mb-3">
                         <Card className="supplier-card" onClick={() => onSearch(supplier.nomeFantasia)}>
                             {/* ... (conteúdo do card do fornecedor) */}
                        </Card>
                     </Col>
                ))}
            </Row>
        </>
    );
};

// Sub-componente para renderizar os resultados quando a busca encontra um FORNECEDOR.
const SupplierResults = ({ results, addToCart }) => (
    <Card>
        <Card.Header as="h5">Catálogo de: {results.supplierName}</Card.Header>
        <Card.Body>
            <Table striped hover responsive>
                {/* ... (tabela com os produtos do fornecedor) */}
            </Table>
        </Card.Body>
    </Card>
);

// Sub-componente para renderizar os resultados quando a busca encontra PRODUTOS.
const ProductResults = ({ results, addToCart }) => (
    <Row>
        {/* Mostra uma mensagem se nenhum produto for encontrado. */}
        {results.data.length === 0 && <Col><Card body><p className="text-muted mb-0">Nenhum produto encontrado com este termo.</p></Card></Col>}
        {/* Mapeia os produtos encontrados para criar um Card para cada um. */}
        {results.data.map(product => (
            <Col md={12} key={product.id} className="mb-3">
                <Card>
                    {/* ... (card detalhado do produto com a lista de fornecedores que o vendem) */}
                </Card>
            </Col>
        ))}
    </Row>
);


// --- COMPONENTE PRINCIPAL ---
const Marketplace = () => {
    // --- ESTADOS DO COMPONENTE ---
    const { user } = useAuth();
    const [cart, setCart] = useState([]); // O carrinho de compras.
    const [showModal, setShowModal] = useState(false); // Controla a visibilidade do modal do carrinho.
    const [success, setSuccess] = useState(''); // Mensagem de sucesso.
    const [searchTerm, setSearchTerm] = useState(''); // O texto da busca.
    const [searchResults, setSearchResults] = useState({ type: 'initial', data: [] }); // Os resultados da busca.
    const [initialData, setInitialData] = useState({ categories: [], suppliers: [] }); // Dados para a tela inicial.

    // `useEffect` para carregar os dados da vitrine inicial assim que o componente é montado.
    useEffect(() => {
        const allProducts = getProductsForMarketplace();
        const uniqueCategories = [...new Set(allProducts.map(p => p.categoria))];
        const featuredSuppliers = getFeaturedSuppliers();
        setInitialData({ categories: uniqueCategories, suppliers: featuredSuppliers });
    }, []); // O array vazio `[]` garante que isso rode só uma vez.

    // Função que executa a busca.
    const handleSearch = (term) => {
        const results = searchMarketplace(term);
        setSearchTerm(term); // Atualiza o texto no input.
        setSearchResults(results); // Atualiza os resultados da busca.
    };
    
    // Permite buscar pressionando a tecla Enter.
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(searchTerm); };

    // Adiciona um item ao carrinho.
    const addToCart = (product, supplier) => {
        // ... (lógica para verificar se o item já existe e adicionar/atualizar a quantidade)
    };
    
    // Finaliza a compra (simulada).
    const handleFinalizePurchase = () => {
        if (cart.length === 0) return;
        // Pega o inventário atual, adiciona os itens comprados e salva de volta.
        const allInventory = getItem('inventory') || [];
        const updatedInventory = [...allInventory];
        cart.forEach(cartItem => {
           // ... (lógica para atualizar ou adicionar itens ao inventário)
        });
        setItem('inventory', updatedInventory);
        // Limpa o carrinho e a tela.
        setCart([]);
        setShowModal(false);
        setSuccess(`Compra simulada com sucesso! ${cart.length} tipo(s) de item foram adicionados ao seu estoque.`);
    };
    
    // --- RENDERIZAÇÃO DO COMPONENTE ---
    return (
        <Container fluid>
            {/* ... (Título, campo de busca e botão do carrinho) */}
            
            <hr />

            {/* --- Renderização Condicional --- */}
            {/* Mostra o componente correto com base no tipo de resultado da busca. */}
            {searchResults.type === 'initial' && <InitialView initialData={initialData} onSearch={handleSearch} />}
            {searchResults.type === 'supplier' && <SupplierResults results={searchResults} addToCart={addToCart} />}
            {searchResults.type === 'product' && <ProductResults results={searchResults} addToCart={addToCart} />}

            {/* Modal do Carrinho de Compras */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                {/* ... (Conteúdo do modal: tabela de itens, total e botões) */}
            </Modal>
        </Container>
    );
};

export default Marketplace;
