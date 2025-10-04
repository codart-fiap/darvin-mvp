// --- ARQUIVO: src/pages/retail/Programs.jsx ---

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getProgramsForRetailer } from '../../state/selectors';
import { setItem, getItem } from '../../state/storage';
import { Container, Card, Row, Col, Button, Collapse, ProgressBar, Alert } from 'react-bootstrap';

const Programs = () => {
    const { user } = useAuth();
    // Força a re-renderização quando uma nova inscrição é feita
    const [lastUpdated, setLastUpdated] = useState(Date.now()); 
    const [expandedId, setExpandedId] = useState(null);

    const programs = useMemo(() => {
        if (!user) return [];
        return getProgramsForRetailer(user.actorId);
    }, [user, lastUpdated]);

    const handleToggleExpand = (programId) => {
        setExpandedId(expandedId === programId ? null : programId);
    };

    const handleJoinProgram = (programId) => {
        const subscriptions = getItem('programSubscriptions') || [];
        const newSubscription = {
            retailerId: user.actorId,
            programId: programId,
            date: new Date().toISOString()
        };
        setItem('programSubscriptions', [...subscriptions, newSubscription]);
        setLastUpdated(Date.now()); // Atualiza o estado para forçar a re-renderização
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0">Programas de Incentivo</h1>
                    <p className="text-muted mb-0">Participe de campanhas exclusivas e ganhe prêmios.</p>
                </div>
            </div>
            
            {programs.length > 0 ? (
                <Row>
                    {programs.map(program => (
                        <Col md={6} lg={4} key={program.id} className="mb-4">
                            <Card className="program-card h-100">
                                <Card.Body className="d-flex flex-column">
                                    <div className="text-center mb-3">
                                        <img src={program.industryLogo} alt={`Logo ${program.industryName}`} className="program-logo"/>
                                    </div>
                                    <Card.Title className="text-center">{program.title}</Card.Title>
                                    <Card.Text className="text-muted text-center small flex-grow-1">
                                        {program.description}
                                    </Card.Text>
                                    <Button 
                                        variant="outline-primary" 
                                        onClick={() => handleToggleExpand(program.id)}
                                        aria-controls={`program-details-${program.id}`}
                                        aria-expanded={expandedId === program.id}
                                    >
                                        {expandedId === program.id ? 'Ver Menos' : 'Ver Detalhes'}
                                    </Button>
                                </Card.Body>
                                <Collapse in={expandedId === program.id}>
                                    <div id={`program-details-${program.id}`}>
                                        <Card.Footer>
                                            <h6>Regras:</h6>
                                            <p><small>{program.rules}</small></p>
                                            <h6>Recompensa:</h6>
                                            <p className="fw-bold text-success"><small>{program.reward}</small></p>
                                            
                                            {program.isSubscribed ? (
                                                <div>
                                                    <h6 className="mt-3">Seu Progresso:</h6>
                                                    <ProgressBar 
                                                        now={program.progress.percentage} 
                                                        label={`${program.progress.percentage}%`} 
                                                        animated 
                                                        variant="success"
                                                    />
                                                    <p className="text-center mt-1"><small>{program.progress.current} de {program.progress.target}</small></p>
                                                     <Alert variant="info" className="mt-3 text-center py-2">
                                                        Você está participando!
                                                     </Alert>
                                                </div>
                                            ) : (
                                                <div className="d-grid mt-3">
                                                    <Button variant="primary" onClick={() => handleJoinProgram(program.id)}>
                                                        Aderir ao Programa
                                                    </Button>
                                                </div>
                                            )}
                                        </Card.Footer>
                                    </div>
                                </Collapse>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                 <p>Nenhum programa de incentivo disponível no momento.</p>
            )}
        </Container>
    );
};

export default Programs;