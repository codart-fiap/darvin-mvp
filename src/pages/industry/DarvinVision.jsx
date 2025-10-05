// --- ARQUIVO COMPLETO: src/pages/industry/DarvinVision.jsx ---
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDarvinVisionData } from '../../state/selectors';
import { Container, Row, Col, Card, Table, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754', '#ffc107', '#20c997', '#dc3545'];

const DarvinVision = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('comportamento');

    const visionData = useMemo(() => {
        if (!user) return null;
        return getDarvinVisionData(user.actorId);
    }, [user]);

    if (!visionData) {
        return <Container className="mt-4"><Alert variant="info">Analisando dados...</Alert></Container>;
    }

    const { 
        salesCombos = [], 
        salesByRegion = [], 
        salesByWeekday = [],
        salesByGender = [],
        salesByAge = [],
        salesByHabit = [],
        topCustomers = [],
        favoritesByProfile = { byGender: {}, byAgeGroup: {}, byHabit: {} }
    } = visionData || {};

    return (
        <Container fluid>
            <div className="mb-4">
                <h1 className="h3">🔍 Darvin Vision</h1>
                <p className="text-muted">
                    Insights avançados sobre comportamento de compra, perfil demográfico e oportunidades de mercado para seus produtos.
                </p>
            </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                {/* TAB 1: COMPORTAMENTO DE COMPRA */}
                <Tab eventKey="comportamento" title="🛒 Comportamento de Compra">
                    <Row>
                        {/* Análise de Cesta */}
                        <Col lg={6} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Combos Mais Vendidos</Card.Title>
                                    <Card.Subtitle className="mb-3 text-muted">
                                        Produtos frequentemente comprados juntos
                                    </Card.Subtitle>
                                    {salesCombos.length > 0 ? (
                                        <Table striped hover size="sm">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Combinação</th>
                                                    <th className="text-center">Frequência</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesCombos.map((combo, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <small>{combo.productA_name}</small>
                                                            <br />
                                                            <small className="text-muted">+ {combo.productB_name}</small>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg="primary">{combo.count}x</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <Alert variant="info">Dados insuficientes para análise de combos</Alert>
                                    )}
                                    <Alert variant="success" className="mt-3">
                                        <strong>💡 Insight:</strong> Use estes dados para criar promoções "compre junto", kits ou para posicionar produtos próximos nas gôndolas.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Vendas por Dia da Semana */}
                        <Col lg={6} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Padrão Semanal de Vendas</Card.Title>
                                    <Card.Subtitle className="mb-3 text-muted">
                                        Quando seus produtos vendem mais?
                                    </Card.Subtitle>
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
                                        <strong>💡 Insight:</strong> Concentre campanhas e promoções nos dias de maior venda para maximizar resultados.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Vendas por Região */}
                        <Col md={12} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Desempenho por Região</Card.Title>
                                    <Table responsive striped size="sm">
                                        <thead>
                                            <tr>
                                                <th>Estado (UF)</th>
                                                <th>Receita Total</th>
                                                <th className="text-center">Unidades Vendidas</th>
                                                <th className="text-center">Preço Médio/Un.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesByRegion.map((region) => (
                                                <tr key={region.uf}>
                                                    <td><Badge bg="secondary">{region.uf}</Badge></td>
                                                    <td><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(region.totalRevenue)}</strong></td>
                                                    <td className="text-center">{region.totalUnits}</td>
                                                    <td className="text-center">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(region.totalRevenue / region.totalUnits)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* TAB 2: PERFIL DEMOGRÁFICO */}
                <Tab eventKey="demografico" title="👥 Perfil Demográfico">
                    <Row>
                        {/* Vendas por Gênero */}
                        <Col md={4} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Vendas por Gênero</Card.Title>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie 
                                                data={salesByGender} 
                                                dataKey="Receita" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius={90}
                                                label={({ name, percentage }) => `${name} (${percentage}%)`}
                                            >
                                                {salesByGender.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="mt-3">
                                        {salesByGender.map((item, idx) => (
                                            <div key={idx} className="d-flex justify-content-between mb-2">
                                                <span><Badge bg="secondary">{item.name}</Badge></span>
                                                <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.Receita)}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Vendas por Faixa Etária */}
                        <Col md={8} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Vendas por Faixa Etária</Card.Title>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={salesByAge}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                            <Legend />
                                            <Bar dataKey="Receita" fill="#0d6efd" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <Alert variant="success" className="mt-3">
                                        <strong>💡 Insight:</strong> Identifique qual faixa etária mais consome seus produtos para direcionar campanhas de marketing.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Vendas por Hábito de Compra */}
                        <Col md={12} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Vendas por Hábito de Compra</Card.Title>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={salesByHabit} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} />
                                            <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                            <Bar dataKey="Receita" fill="#198754" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <Alert variant="info" className="mt-3">
                                        <strong>💡 Insight:</strong> Compradores com hábito "Compra Semanal" e "Fim de Semana" são alvos ideais para programas de fidelidade.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* TAB 3: TOP CLIENTES */}
                <Tab eventKey="clientes" title="⭐ Top Clientes">
                    <Row>
                        <Col md={12} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Top 10 Clientes por Receita</Card.Title>
                                    <Card.Subtitle className="mb-3 text-muted">
                                        Seus consumidores mais valiosos
                                    </Card.Subtitle>
                                    {topCustomers.length > 0 ? (
                                        <Table striped hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Cliente</th>
                                                    <th>Perfil</th>
                                                    <th className="text-center">Compras</th>
                                                    <th>Receita Total</th>
                                                    <th>Ticket Médio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topCustomers.map((customer, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            {index < 3 ? (
                                                                <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'danger'}>
                                                                    {index + 1}º
                                                                </Badge>
                                                            ) : (
                                                                <span>{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td><strong>{customer.name}</strong></td>
                                                        <td>
                                                            <small>
                                                                {customer.gender && <Badge bg="info" className="me-1">{customer.gender}</Badge>}
                                                                {customer.age && <Badge bg="secondary" className="me-1">{customer.age} anos</Badge>}
                                                                {customer.habit && <Badge bg="success">{customer.habit}</Badge>}
                                                            </small>
                                                        </td>
                                                        <td className="text-center">{customer.purchases}</td>
                                                        <td><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent)}</strong></td>
                                                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.averageTicket)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <Alert variant="info">Não há dados suficientes de clientes identificados</Alert>
                                    )}
                                    <Alert variant="warning" className="mt-3">
                                        <strong>💡 Insight:</strong> Crie programas de fidelidade personalizados para seus top clientes e aumente o LTV (Lifetime Value).
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* TAB 4: PREFERÊNCIAS POR PERFIL */}
                <Tab eventKey="preferencias" title="🎯 Preferências por Perfil">
                    <Row>
                        {/* Produtos Favoritos por Gênero */}
                        <Col md={12} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Produtos Favoritos por Gênero</Card.Title>
                                    <Row>
                                        {Object.keys(favoritesByProfile.byGender || {}).length > 0 ? (
                                            Object.keys(favoritesByProfile.byGender).map((gender, idx) => (
                                                <Col md={4} key={idx} className="mb-3">
                                                    <h6><Badge bg="primary">{gender}</Badge></h6>
                                                    <Table size="sm" bordered>
                                                        <thead>
                                                            <tr>
                                                                <th>Produto</th>
                                                                <th className="text-center">Qtde</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(favoritesByProfile.byGender[gender] || []).map((product, pidx) => (
                                                                <tr key={pidx}>
                                                                    <td><small>{product.name}</small></td>
                                                                    <td className="text-center"><Badge bg="secondary">{product.qtde}</Badge></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Col>
                                            ))
                                        ) : (
                                            <Col md={12}>
                                                <Alert variant="info">Não há dados demográficos suficientes para esta análise</Alert>
                                            </Col>
                                        )}
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Produtos Favoritos por Faixa Etária */}
                        <Col md={12} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Produtos Favoritos por Faixa Etária</Card.Title>
                                    <Row>
                                        {Object.keys(favoritesByProfile.byAgeGroup || {}).length > 0 ? (
                                            Object.keys(favoritesByProfile.byAgeGroup).map((age, idx) => (
                                                <Col md={4} key={idx} className="mb-3">
                                                    <h6><Badge bg="success">{age}</Badge></h6>
                                                    <Table size="sm" bordered>
                                                        <thead>
                                                            <tr>
                                                                <th>Produto</th>
                                                                <th className="text-center">Qtde</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(favoritesByProfile.byAgeGroup[age] || []).map((product, pidx) => (
                                                                <tr key={pidx}>
                                                                    <td><small>{product.name}</small></td>
                                                                    <td className="text-center"><Badge bg="secondary">{product.qtde}</Badge></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Col>
                                            ))
                                        ) : (
                                            <Col md={12}>
                                                <Alert variant="info">Não há dados demográficos suficientes para esta análise</Alert>
                                            </Col>
                                        )}
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Produtos Favoritos por Hábito de Compra */}
                        <Col md={12} className="mb-4">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Produtos Favoritos por Hábito de Compra</Card.Title>
                                    <Row>
                                        {Object.keys(favoritesByProfile.byHabit || {}).length > 0 ? (
                                            Object.keys(favoritesByProfile.byHabit).map((habit, idx) => (
                                                <Col lg={4} md={6} key={idx} className="mb-3">
                                                    <h6><Badge bg="warning" text="dark">{habit}</Badge></h6>
                                                    <Table size="sm" bordered>
                                                        <thead>
                                                            <tr>
                                                                <th>Produto</th>
                                                                <th className="text-center">Qtde</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(favoritesByProfile.byHabit[habit] || []).map((product, pidx) => (
                                                                <tr key={pidx}>
                                                                    <td><small>{product.name}</small></td>
                                                                    <td className="text-center"><Badge bg="secondary">{product.qtde}</Badge></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Col>
                                            ))
                                        ) : (
                                            <Col md={12}>
                                                <Alert variant="info">Não há dados demográficos suficientes para esta análise</Alert>
                                            </Col>
                                        )}
                                    </Row>
                                    <Alert variant="success" className="mt-3">
                                        <strong>💡 Insight:</strong> Use essas preferências para criar campanhas segmentadas e aumentar a conversão por perfil de cliente.
                                    </Alert>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
            </Tabs>

            {/* Card de Resumo Executivo */}
            <Row>
                <Col md={12}>
                    <Card bg="light">
                        <Card.Body>
                            <Card.Title>📊 Resumo Executivo</Card.Title>
                            <Row>
                                <Col md={3}>
                                    <div className="text-center p-3">
                                        <h4>{salesCombos.length}</h4>
                                        <small className="text-muted">Combos Identificados</small>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center p-3">
                                        <h4>{topCustomers.length}</h4>
                                        <small className="text-muted">Top Clientes</small>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center p-3">
                                        <h4>{salesByRegion.length}</h4>
                                        <small className="text-muted">Regiões Ativas</small>
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <div className="text-center p-3">
                                        <h4>{Object.keys(favoritesByProfile.byGender || {}).length}</h4>
                                        <small className="text-muted">Perfis Analisados</small>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DarvinVision;