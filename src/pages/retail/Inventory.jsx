// FILE: src/pages/retail/Inventory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getInventoryByRetailer } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { Container, Table, Button, Modal, Form, Row, Col, Card, Badge, Alert } from 'react-bootstrap';

const Inventory = () => {
  const { user } = useAuth();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalType, setModalType] = useState('entrada');
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      try {
        console.log('Carregando inventário para:', user.actorId);
        const items = getInventoryByRetailer(user.actorId);
        console.log('Itens carregados:', items);
        setInventoryItems(items);
      } catch (err) {
        console.error('ERRO ao carregar inventário:', err);
        setError(err.message);
      }
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    try {
      return inventoryItems.filter(item => {
        const categoryMatch = categoryFilter === 'all' || item.categoria === categoryFilter;
        return categoryMatch;
      });
    } catch (err) {
      console.error('ERRO ao filtrar items:', err);
      return [];
    }
  }, [inventoryItems, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    try {
      return [...new Set(inventoryItems.map(item => item.categoria || 'Diversos'))].sort();
    } catch (err) {
      console.error('ERRO ao extrair categorias:', err);
      return ['Diversos'];
    }
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

    try {
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
    } catch (err) {
      console.error('ERRO ao atualizar estoque:', err);
      alert('Erro ao atualizar estoque: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (err) {
      return 'N/A';
    }
  };

  if (!user) {
    return <Container><p>Carregando...</p></Container>;
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <Alert.Heading>Erro ao carregar estoque</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Abra o Console do navegador (F12) para ver detalhes do erro.
          </p>
        </Alert>
      </Container>
    );
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
            <Col md={8} className="d-flex align-items-end">
              <small className="text-muted">
                Total de itens: {filteredItems.length}
              </small>
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
              <th>Marca</th>
              <th className="text-center">Estoque Atual</th>
              <th>Custo Médio</th>
              <th>Preço Venda</th>
              <th>Lucro Est. (Un)</th>
              <th>Validade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted">
                  Nenhum produto no estoque
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                try {
                  return (
                    <tr key={item.id || index}>
                      <td><small>{item.sku || 'N/A'}</small></td>
                      <td>{item.nome || 'Produto sem nome'}</td>
                      <td><small className="text-muted">{item.marca || 'N/A'}</small></td>
                      <td className="text-center">
                        <Badge bg="primary" pill className="p-2 fs-6">
                          {item.estoque ?? 0}
                        </Badge>
                      </td>
                      <td>{item.custoMedio ? `R$ ${parseFloat(item.custoMedio).toFixed(2)}` : 'N/A'}</td>
                      <td>{item.precoVenda ? `R$ ${parseFloat(item.precoVenda).toFixed(2)}` : 'N/A'}</td>
                      <td>
                        {item.precoVenda && item.custoMedio ? (
                          <span className="text-success fw-bold">
                            R$ {(parseFloat(item.precoVenda) - parseFloat(item.custoMedio)).toFixed(2)}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>{formatDate(item.dataValidade)}</td>
                      <td>
                        <Button variant="success" size="sm" className="me-2" onClick={() => handleOpenModal(item, 'entrada')}>
                          Entrada
                        </Button>
                        <Button variant="warning" size="sm" onClick={() => handleOpenModal(item, 'ajuste')}>
                          Ajuste
                        </Button>
                      </td>
                    </tr>
                  );
                } catch (err) {
                  console.error('ERRO ao renderizar item:', item, err);
                  return (
                    <tr key={index}>
                      <td colSpan="9" className="text-danger">
                        Erro ao exibir produto (ver console)
                      </td>
                    </tr>
                  );
                }
              })
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'entrada' ? 'Registrar Entrada' : 'Ajustar Estoque'} de {currentItem?.nome}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Estoque Atual: <strong>{currentItem?.estoque ?? 0}</strong></p>
          <Form.Group>
            <Form.Label>
              {modalType === 'entrada' ? 'Quantidade a Adicionar' : 'Novo Valor do Estoque'}
            </Form.Label>
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