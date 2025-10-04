// --- ARQUIVO ATUALIZADO: src/pages/retail/Programs.jsx ---
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getProgramsForRetailer, getRetailerRating, getActorsByType } from '../../state/selectors';
import { setItem, getItem } from '../../state/storage';
import { Container, Card, Row, Col, Button, Collapse, ProgressBar, Alert, Modal, Nav, Form, Badge } from 'react-bootstrap';
import { StarFill, BarChartLineFill, PeopleFill, CalendarCheckFill } from 'react-bootstrap-icons';

const Programs = () => {
    const { user } = useAuth();
    const [lastUpdated, setLastUpdated] = useState(Date.now()); 
    const [expandedId, setExpandedId] = useState(null);
    
    // Estados para o Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [programToJoin, setProgramToJoin] = useState(null);

    // Estados para Filtros
    const [activeTab, setActiveTab] = useState('new'); // new, in_progress, completed
    const [industryFilter, setIndustryFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('endDate');

    // Busca de dados
    const allPrograms = useMemo(() => {
        if (!user) return [];
        return getProgramsForRetailer(user.actorId);
    }, [user, lastUpdated]);

    const ratingData = useMemo(() => {
        if (!user) return null;
        return getRetailerRating(user.actorId);
    }, [user, lastUpdated]);

    const industries = useMemo(() => getActorsByType('industry'), []);

    // Lógica de filtragem e ordenação
    const filteredAndSortedPrograms = useMemo(() => {
        let programs = allPrograms;

        // Filtro por Status (Abas)
        if (activeTab === 'new') {
            programs = programs.filter(p => !p.isSubscribed && !p.isCompleted);
        } else if (activeTab === 'in_progress') {
            programs = programs.filter(p => p.isSubscribed && !p.isCompleted);
        } else if (activeTab === 'completed') {
            programs = programs.filter(p => p.isCompleted);
        }

        // Filtro por Indústria
        if (industryFilter !== 'all') {
            programs = programs.filter(p => p.industryId === industryFilter);
        }

        // Ordenação
        programs.sort((a, b) => {
            if (sortOrder === 'endDate') {
                return new Date(a.endDate) - new Date(b.endDate);
            }
            // Adicionar outras lógicas de ordenação se necessário
            return 0;
        });

        return programs;
    }, [allPrograms, activeTab, industryFilter, sortOrder]);


    // Handlers
    const handleToggleExpand = (programId) => {
        setExpandedId(expandedId === programId ? null : programId);
    };

    const handleShowConfirmModal = (program) => {
        setProgramToJoin(program);
        setShowConfirmModal(true);
    };

    const handleJoinProgram = () => {
        if (!programToJoin) return;
        const subscriptions = getItem('programSubscriptions') || [];
        const newSubscription = {
            retailerId: user.actorId,
            programId: programToJoin.id,
            date: new Date().toISOString()
        };
        setItem('programSubscriptions', [...subscriptions, newSubscription]);
        setLastUpdated(Date.now());
        setShowConfirmModal(false);
        setProgramToJoin(null);
        setActiveTab('in_progress'); // Muda para a aba "Em Andamento"
    };

    const RatingCard = () => (
        <Card className="mb-4">
            <Card.Body>
                <div className="d-flex align-items-center mb-3">
                    <StarFill className="me-2 text-warning" size={24}/>
                    <Card.Title className="mb-0">Seu Rating de Dados: <span className={`text-primary h4`}>{ratingData?.rating}</span></Card.Title>
                </div>
                <p className="small text-muted">Seu rating mede a qualidade e consistência dos dados que você compartilha. Um rating alto pode te dar acesso a programas e benefícios exclusivos!</p>
                
                <div className="mb-2"><small><CalendarCheckFill className="me-2"/><strong>Regularidade: {ratingData?.details.regularity}%</strong><br/>Frequência de dias com vendas.</small></div>
                <div className="mb-2"><small><PeopleFill className="me-2"/><strong>Granularidade: {ratingData?.details.granularity}%</strong><br/>Vendas com cliente identificado.</small></div>
                <div><small><BarChartLineFill className="me-2"/><strong>Volume: {ratingData?.details.volume}%</strong><br/>Faturamento no período.</small></div>
            </Card.Body>
        </Card>
    );

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0">Programas de Incentivo</h1>
                    <p className="text-muted mb-0">Participe de campanhas exclusivas e ganhe prêmios.</p>
                </div>
            </div>
            
            <Row>
                <Col lg={8}>
                    {/* Filtros e Abas */}
                    <Card className="mb-4">
                         <Card.Header>
                            <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="card-header-tabs">
                                <Nav.Item><Nav.Link eventKey="new">Novos</Nav.Link></Nav.Item>
                                <Nav.Item><Nav.Link eventKey="in_progress">Em Andamento</Nav.Link></Nav.Item>
                                <Nav.Item><Nav.Link eventKey="completed">Concluídos</Nav.Link></Nav.Item>
                            </Nav>
                         </Card.Header>
                         <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label><small>Filtrar por Indústria</small></Form.Label>
                                        <Form.Select size="sm" value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
                                            <option value="all">Todas</option>
                                            {industries.map(ind => <option key={ind.id} value={ind.id}>{ind.nomeFantasia}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                     <Form.Group>
                                        <Form.Label><small>Ordenar por</small></Form.Label>
                                        <Form.Select size="sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                                            <option value="endDate">Data de Término</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                         </Card.Body>
                    </Card>

                    {/* Lista de Programas */}
                    {filteredAndSortedPrograms.length > 0 ? (
                        filteredAndSortedPrograms.map(program => (
                            <Card key={program.id} className="program-card mb-3">
                                <Card.Body>
                                    <Row>
                                        <Col md={3} className="text-center">
                                             <img src={program.industryLogo} alt={`Logo ${program.industryName}`} className="program-logo mb-2"/>
                                             <div>
                                                {program.tags?.map(tag => <Badge bg="secondary" className="me-1" key={tag}>{tag}</Badge>)}
                                             </div>
                                        </Col>
                                        <Col md={9}>
                                            <Card.Title>{program.title}</Card.Title>
                                            <Card.Text className="small">{program.description}</Card.Text>
                                            <Button variant="outline-primary" size="sm" onClick={() => handleToggleExpand(program.id)}>
                                                {expandedId === program.id ? 'Ver Menos' : 'Ver Detalhes'}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                                <Collapse in={expandedId === program.id}>
                                    <div>
                                        <Card.Footer>
                                            <h6>Regras:</h6>
                                            <p><small>{program.rules}</small></p>
                                            <h6>Recompensa:</h6>
                                            <p className="fw-bold text-success"><small>{program.reward}</small></p>
                                            
                                            {program.isSubscribed ? (
                                                <div>
                                                    <h6 className="mt-3">Seu Progresso:</h6>
                                                    <ProgressBar now={program.progress.percentage} label={`${program.progress.percentage}%`} animated variant="success"/>
                                                    <p className="text-center mt-1"><small>{program.progress.current} de {program.progress.target}</small></p>
                                                </div>
                                            ) : !program.isCompleted && (
                                                <div className="d-grid mt-3">
                                                    <Button variant="primary" onClick={() => handleShowConfirmModal(program)}>Aderir ao Programa</Button>
                                                </div>
                                            )}
                                            {program.isCompleted && (
                                                <Alert variant={program.progress.percentage >= 100 ? "success" : "secondary"} className="mt-3 text-center py-2">
                                                    {program.progress.percentage >= 100 ? "Parabéns, você atingiu a meta!" : "Programa encerrado."}
                                                </Alert>
                                            )}
                                        </Card.Footer>
                                    </div>
                                </Collapse>
                            </Card>
                        ))
                    ) : (
                         <Alert variant="light">Nenhum programa encontrado para os filtros selecionados.</Alert>
                    )}
                </Col>

                {/* Coluna da Direita: Rating */}
                <Col lg={4}>
                    <RatingCard />
                </Col>
            </Row>

            {/* Modal de Confirmação */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Adesão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Você tem certeza que deseja participar do programa <strong>"{programToJoin?.title}"</strong>?</p>
                    <p className="text-muted small"><strong>Regras:</strong> {programToJoin?.rules}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleJoinProgram}>Sim, quero participar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Programs;