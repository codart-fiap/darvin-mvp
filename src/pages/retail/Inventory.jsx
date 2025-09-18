// FILE: src/pages/retail/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getInventoryByRetailer } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { Container, Table, Button, Modal, Form, Row, Col, Card, Badge } from 'react-bootstrap';

const Inventory = () => {
  const { user } = useAuth();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalType, setModalType] = useState('entrada');
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (user) {
      setInventoryItems(getInventoryByRetailer(user.actorId));
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
        const categoryMatch = categoryFilter === 'all' || item.categoria === categoryFilter;
        return categoryMatch;
    });
  }, [inventoryItems, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(inventoryItems.map(item => item.categoria))].sort();
  }, [inventoryItems]);

  const handleOpenModal = (item, type) => {
    setCurrentItem(item);
    setModalType(type);
    setShowModal(true);
    setAdjustmentValue(type === 'ajuste' ? item.estoque : 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentItem(null);
  };

  const handleUpdateStock = () => {
    if (!currentItem) return;

    const allInventory = getItem('inventory') || [];
    const updatedInventory = allInventory.map(invItem => {
      if (invItem.id === currentItem.id) {
        const currentValue = invItem.estoque;
        const newValue = parseInt(adjustmentValue, 10);

        if (modalType === 'entrada') {
          return { ...invItem, estoque: currentValue + newValue };
        } else {
          return { ...invItem, estoque: newValue };
        }
      }
      return invItem;
    });

    setItem('inventory', updatedInventory);
    setInventoryItems(getInventoryByRetailer(user.actorId));
    handleCloseModal();
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <Container fluid>
      <h1 className="h3 mb-3">Gestão de Estoque</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filtrar por Categoria</Form.Label>
                <Form.Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="all">Todas as Categorias</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Table striped hover responsive className="mb-0 align-middle">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Produto</th>
              <th>Marca</th> {/* <-- COLUNA ADICIONADA */}
              <th className="text-center">Estoque Atual</th>
              <th>Custo Médio</th>
              <th>Preço Venda</th>
              <th>Lucro Est. (Un)</th>
              <th>Validade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td><small>{item.sku}</small></td>
                <td>{item.nome}</td>
                <td><small className="text-muted">{item.marca}</small></td> {/* <-- DADO ADICIONADO */}
                <td className="text-center"><Badge bg="primary" pill className="p-2 fs-6">{item.estoque}</Badge></td>
                <td>{item.custoMedio ? `R$ ${item.custoMedio.toFixed(2)}` : 'N/A'}</td>
                <td>{item.precoVenda ? `R$ ${item.precoVenda.toFixed(2)}` : 'N/A'}</td>
                <td>
                  {item.precoVenda && item.custoMedio ? (
                    <span className="text-success fw-bold">
                      R$ {(item.precoVenda - item.custoMedio).toFixed(2)}
                    </span>
                  ) : 'N/A'}
                </td>
                <td>{item.dataValidade ? formatDate(item.dataValidade) : 'N/A'}</td>
                <td>
                  <Button variant="success" size="sm" className="me-2" onClick={() => handleOpenModal(item, 'entrada')}>Entrada</Button>
                  <Button variant="warning" size="sm" onClick={() => handleOpenModal(item, 'ajuste')}>Ajuste</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{modalType === 'entrada' ? 'Registrar Entrada' : 'Ajustar Estoque'} de {currentItem?.nome}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Estoque Atual: <strong>{currentItem?.estoque}</strong></p>
          <Form.Group>
            <Form.Label>{modalType === 'entrada' ? 'Quantidade a Adicionar' : 'Novo Valor do Estoque'}</Form.Label>
            <Form.Control 
              type="number" 
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              min="0"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdateStock}>
            Salvar Alterações
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Inventory;