// --- ARQUIVO NOVO: src/pages/industry/DarvinVision.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, Recharts, React-Bootstrap ---

import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDarvinVisionData } from '../../state/selectors'; // Será criada a seguir
import { Container, Row, Col, Card, Table, Alert } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DarvinVision = () => {
    const { user } = useAuth();

    // Este seletor conterá a lógica para as análises avançadas
    const visionData = useMemo(() => {
        if (!user) return null;
        return getDarvinVisionData(user.actorId);
    }, [user]);

    if (!visionData) {
        return <Container>Analisando dados...</Container>;
    }

    const { salesCombos, salesByRegion, salesByWeekday } = visionData;

    return (
        <Container fluid>
            <div className="mb-4">
                <h1 className="h3">Darvin Vision</h1>
                <p className="text-muted">
                    Insights avançados sobre o comportamento de compra, padrões de consumo e oportunidades de mercado para seus produtos.
                </p>
            </div>

            {/* Seção 1: Análise de Cesta de Compras (Combos) */}
            <Row>
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Combos de Venda Mais Comuns (Análise de Cesta)</Card.Title>
                            <Card.Subtitle className="mb-3 text-muted">
                                Produtos que são frequentemente comprados juntos na mesma transação.
                            </Card.Subtitle>
                            <Table striped hover size="sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Combinação de Produtos</th>
                                        <th className="text-center">Frequência</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesCombos.map((combo, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{combo.productA_name} + {combo.productB_name}</td>
                                            <td className="text-center">{combo.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                             <Alert variant="info" className="mt-3">
                                <strong>Insight:</strong> Use estes dados para criar promoções "compre junto", kits ou para posicionar produtos próximos um do outro nos pontos de venda.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Seção 2: Análise Geográfica */}
                <Col md={6} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Vendas por Região (Estado)</Card.Title>
                             <Table responsive striped size="sm">
                                <thead>
                                    <tr>
                                        <th>Estado (UF)</th>
                                        <th>Receita Total</th>
                                        <th className="text-center">Unidades Vendidas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesByRegion.map((region) => (
                                        <tr key={region.uf}>
                                            <td><strong>{region.uf}</strong></td>
                                            <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(region.totalRevenue)}</td>
                                            <td className="text-center">{region.totalUnits}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Seção 3: Padrões de Consumo */}
                <Col md={6} className="mb-4">
                    <Card>
                        <Card.Body>
                            <Card.Title>Vendas por Dia da Semana</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={salesByWeekday}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                    <Bar dataKey="Receita" fill="#6f42c1" />
                                </BarChart>
                            </ResponsiveContainer>
                            <Alert variant="info" className="mt-3">
                                <strong>Insight:</strong> Identifique os dias de maior venda para concentrar campanhas de marketing ou promoções de curta duração.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Seção 4: Placeholder para Dados Demográficos */}
            <Row>
                <Col>
                     <Card>
                        <Card.Header>Análise Demográfica (Exemplo)</Card.Header>
                        <Card.Body>
                            <Card.Text className="text-muted">
                                Esta seção está aguardando a integração de dados demográficos dos consumidores (como idade, gênero, etc.).
                                Com esses dados, seria possível analisar qual perfil de consumidor mais compra seus produtos, permitindo um marketing muito mais direcionado.
                            </Card.Text>
                            <Alert variant="warning">
                                <strong>Oportunidade:</strong> Para habilitar esta análise, o modelo de dados de `clientes` ou `vendas` precisaria ser expandido para capturar informações demográficas no ponto de venda.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

        </Container>
    );
};

export default DarvinVision;