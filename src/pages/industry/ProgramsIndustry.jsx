// --- ARQUIVO NOVO: src/pages/industry/ProgramsIndustry.jsx ---
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getProgramsByIndustry } from '../../state/selectors';
import { setItem, getItem } from '../../state/storage';
import { generateId } from '../../utils/ids';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge, ListGroup } from 'react-bootstrap';
import { PlusCircleFill, PencilSquare, Trash3Fill, BarChartLineFill, PeopleFill } from 'react-bootstrap-icons';

const ProgramsIndustry = () => {
    const { user } = useAuth();
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('new'); // 'new', 'edit', 'delete'
    const [currentProgram, setCurrentProgram] = useState(null);

    const [newProgramData, setNewProgramData] = useState({
        title: '',
        description: '',
        rules: '',
        reward: '',
        startDate: '',
        endDate: '',
        metricType: 'volume_venda_sku',
        metricValue: '',
        tags: ''
    });

    const programs = useMemo(() => {
        if (!user) return [];
        return getProgramsByIndustry(user.actorId);
    }, [user, lastUpdated]);

    const handleShowModal = (type, program = null) => {
        setModalType(type);
        setCurrentProgram(program);
        if (type === 'new') {
            setNewProgramData({
                title: '', description: '', rules: '', reward: '', startDate: '', endDate: '',
                metricType: 'volume_venda_sku', metricValue: '', tags: ''
            });
        } else if (type === 'edit' && program) {
            setNewProgramData({
                title: program.title,
                description: program.description,
                rules: program.rules,
                reward: program.reward,
                startDate: program.startDate.split('T')[0],
                endDate: program.endDate.split('T')[0],
                tags: program.tags.join(', '),
                metricType: program.metric.type,
                metricValue: program.metric.target || program.metric.sku || ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentProgram(null);
    };

    const handleSaveProgram = () => {
        const allPrograms = getItem('programs') || [];

        let metric = {};
        if (newProgramData.metricType === 'volume_venda_sku') {
            metric = { type: 'volume_venda_sku', sku: newProgramData.metricValue, target: 50 }; // Exemplo
        } else {
            metric = { type: newProgramData.metricType, target: parseFloat(newProgramData.metricValue) };
        }

        const programPayload = {
            id: modalType === 'edit' ? currentProgram.id : generateId(),
            industryId: user.actorId,
            title: newProgramData.title,
            description: newProgramData.description,
            rules: newProgramData.rules,
            reward: newProgramData.reward,
            startDate: new Date(newProgramData.startDate).toISOString(),
            endDate: new Date(newProgramData.endDate).toISOString(),
            tags: newProgramData.tags.split(',').map(t => t.trim()),
            metric: metric
        };

        if (modalType === 'edit') {
            const updatedPrograms = allPrograms.map(p => p.id === currentProgram.id ? programPayload : p);
            setItem('programs', updatedPrograms);
        } else {
            setItem('programs', [...allPrograms, programPayload]);
        }

        setLastUpdated(Date.now());
        handleCloseModal();
    };

    const handleDeleteProgram = () => {
        const allPrograms = getItem('programs') || [];
        const updatedPrograms = allPrograms.filter(p => p.id !== currentProgram.id);
        setItem('programs', updatedPrograms);
        setLastUpdated(Date.now());
        handleCloseModal();
    };


    const renderModalContent = () => {
        if (modalType === 'delete') {
            return (
                <>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirmar Exclusão</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Você tem certeza que deseja excluir o programa <strong>"{currentProgram?.title}"</strong>?</p>
                        <p className="text-danger">Esta ação não pode ser desfeita.</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDeleteProgram}>Sim, Excluir</Button>
                    </Modal.Footer>
                </>
            );
        }

        return (
            <>
                <Modal.Header closeButton>
                    <Modal.Title>{modalType === 'new' ? 'Criar Novo Programa' : 'Editar Programa'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Título do Programa</Form.Label>
                            <Form.Control type="text" value={newProgramData.title} onChange={e => setNewProgramData({...newProgramData, title: e.target.value})} />
                        </Form.Group>
                         <Form.Group className="mb-3">
                            <Form.Label>Descrição Curta</Form.Label>
                            <Form.Control as="textarea" rows={2} value={newProgramData.description} onChange={e => setNewProgramData({...newProgramData, description: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Regras</Form.Label>
                            <Form.Control as="textarea" rows={3} value={newProgramData.rules} onChange={e => setNewProgramData({...newProgramData, rules: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Recompensa</Form.Label>
                            <Form.Control type="text" value={newProgramData.reward} onChange={e => setNewProgramData({...newProgramData, reward: e.target.value})} />
                        </Form.Group>
                         <Form.Group className="mb-3">
                            <Form.Label>Tags (separadas por vírgula)</Form.Label>
                            <Form.Control type="text" value={newProgramData.tags} onChange={e => setNewProgramData({...newProgramData, tags: e.target.value})} />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data de Início</Form.Label>
                                    <Form.Control type="date" value={newProgramData.startDate} onChange={e => setNewProgramData({...newProgramData, startDate: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data de Término</Form.Label>
                                    <Form.Control type="date" value={newProgramData.endDate} onChange={e => setNewProgramData({...newProgramData, endDate: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveProgram}>Salvar Programa</Button>
                </Modal.Footer>
            </>
        );
    };

    return (
        <Container fluid>
             <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0">Gestão de Programas</h1>
                    <p className="text-muted mb-0">Crie e gerencie seus programas de incentivo.</p>
                </div>
                <Button variant="primary" onClick={() => handleShowModal('new')}>
                    <PlusCircleFill className="me-2"/>
                    Criar Novo Programa
                </Button>
            </div>

            {programs.length > 0 ? (
                <Row>
                    {programs.map(program => (
                        <Col lg={6} key={program.id} className="mb-4">
                            <Card className="h-100">
                                <Card.Header>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Card.Title className="h6 mb-0">{program.title}</Card.Title>
                                        <div>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal('edit', program)}>
                                                <PencilSquare />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleShowModal('delete', program)}>
                                                <Trash3Fill />
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <p><small>{program.description}</small></p>
                                    <div className="mb-3">
                                        {program.tags?.map(tag => <Badge bg="secondary" className="me-1" key={tag}>{tag}</Badge>)}
                                    </div>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item>
                                            <strong>Período:</strong> {new Date(program.startDate).toLocaleDateString()} a {new Date(program.endDate).toLocaleDateString()}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <strong>Recompensa:</strong> <span className="text-success">{program.reward}</span>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                                <Card.Footer>
                                     <Row className="text-center">
                                        <Col>
                                            <PeopleFill className="me-2" />
                                            <strong>{program.participants}</strong> Varejistas
                                        </Col>
                                        <Col>
                                            <BarChartLineFill className="me-2" />
                                            <strong>R$ {program.totalSales.toFixed(2)}</strong> em Vendas
                                        </Col>
                                    </Row>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Alert variant="light">Nenhum programa criado ainda.</Alert>
            )}

             <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                {renderModalContent()}
            </Modal>
        </Container>
    );
};

export default ProgramsIndustry;