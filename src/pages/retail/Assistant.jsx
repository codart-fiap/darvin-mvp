// FILE: src/pages/retail/Assistant.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRetailerInsights } from '../../state/selectors';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { BoxSeam, ExclamationCircle, GraphUpArrow, GraphDownArrow } from 'react-bootstrap-icons';

const ICONS = { BoxSeam, ExclamationCircle, GraphUpArrow, GraphDownArrow };

const Assistant = () => {
    const { user } = useAuth();

    const insights = useMemo(() => {
        if (!user) return [];
        return getRetailerInsights(user.actorId); 
    }, [user]);

    if (!user) {
        return <div>Carregando...</div>;
    }

    return (
        <Container fluid>
            <div className="mb-4">
                <h1 className="h3">Assistente de Performance</h1>
                <p className="text-muted">
                    Aqui estão os insights e recomendações gerados com base nos dados da sua loja.
                </p>
            </div>

            <Row>
                {insights.length > 0 ? insights.map((insight) => {
                    const IconComponent = ICONS[insight.icon];
                    return (
                        <Col md={6} lg={4} key={insight.id} className="mb-4">
                            <Card className={`insight-card insight-${insight.type} h-100`}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        {IconComponent && <IconComponent className="me-2" size={20} />}
                                        <Card.Title as="h6" className="mb-0">{insight.title}</Card.Title>
                                    </div>
                                    <Card.Text>{insight.description}</Card.Text>
                                    <p className="insight-card-metric mt-auto">{insight.metric}</p>
                                </Card.Body>
                                <Card.Footer className="text-end">
                                    <Button as={Link} to={insight.action.link} variant="primary" size="sm">
                                        {insight.action.text}
                                    </Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    );
                }) : (
                    <Col>
                        <Card body>
                            <p className="text-muted mb-0">Nenhum insight novo para exibir no momento. Continue registrando suas vendas e atualizando seu estoque!</p>
                        </Card>
                    </Col>
                )}
            </Row>
        </Container>
    );
};

export default Assistant;