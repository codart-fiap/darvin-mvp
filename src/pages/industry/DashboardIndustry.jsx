// --- ARQUIVO NOVO: src/pages/industry/DashboardIndustry.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript, Recharts, React-Bootstrap ---

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getIndustryDashboardData } from '../../state/selectors'; // Será criada a seguir
import { Container, Row, Col, Card, ButtonGroup, Button, Table, Badge } from 'react-bootstrap';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754', '#ffc107', '#20c997'];

const DashboardIndustry = () => {
    const { user } = useAuth();
    const [period, setPeriod] = useState(30);
    const [retailerFilter, setRetailerFilter] = useState(null);

    // O seletor buscará os dados com base no ID da indústria logada
    const dashboardData = useMemo(() => {
        if (!user) return null;
        return getIndustryDashboardData(user.actorId, period, retailerFilter);
    }, [user, period, retailerFilter]);

    if (!dashboardData) {
        return <Container>Carregando dados da indústria...</Container>;
    }

    const { kpis, charts, tables } = dashboardData;
    
    const handleBarClick = (data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const retailerName = data.activePayload[0].payload.name;
            setRetailerFilter(prev => prev === retailerName ? null : retailerName);
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                 <div>
                    <h1 className="h3 mb-0 d-inline-block me-3">Dashboard da Indústria</h1>
                     {retailerFilter && (
                        <Badge pill bg="info" as="button" onClick={() => setRetailerFilter(null)} className="border-0">
                            Varejista: {retailerFilter} &times;
                        </Badge>
                    )}
                </div>
                <ButtonGroup>
                    <Button variant={period === 7 ? 'primary' : 'outline-primary'} onClick={() => setPeriod(7)}>7 Dias</Button>
                    <Button variant={period === 30 ? 'primary' : 'outline-primary'} onClick={() => setPeriod(30)}>30 Dias</Button>
                    <Button variant={period === 90 ? 'primary' : 'outline-primary'} onClick={() => setPeriod(90)}>90 Dias</Button>
                </ButtonGroup>
            </div>

            {/* KPIs Personalizados para a Indústria */}
            <Row>
                <Col md={3} className="mb-3"><Card body className="text-center"><h5>Receita Gerada</h5><p className="h4">R$ {kpis.totalRevenue.toFixed(2)}</p></Card></Col>
                <Col md={3} className="mb-3"><Card body className="text-center"><h5>Unidades Vendidas</h5><p className="h4">{kpis.totalUnitsSold}</p></Card></Col>
                <Col md={3} className="mb-3"><Card body className="text-center"><h5>Varejistas Ativos</h5><p className="h4">{kpis.activeRetailers}</p></Card></Col>
                <Col md={3} className="mb-3"><Card body className="text-center"><h5>Preço Médio / Un.</h5><p className="h4">R$ {kpis.averagePricePerUnit.toFixed(2)}</p></Card></Col>
            </Row>

            <Row className="mt-4">
                {/* Gráfico de Vendas por Varejista */}
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Vendas por Varejista (em R$)</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={charts.salesByRetailer} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="Receita" fill="var(--primary-color)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
                {/* Gráfico de Receita por Produto */}
                <Col md={4}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Receita por Produto</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={charts.revenueByProduct} dataKey="Receita" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {charts.revenueByProduct.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mt-4">
                {/* Tabela de Top 5 Produtos */}
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Top 5 Produtos (Unidades Vendidas)</Card.Title>
                            <Table striped responsive>
                                <thead><tr><th>#</th><th>Produto</th><th>Unidades</th></tr></thead>
                                <tbody>
                                    {tables.topProducts.map((p, index) => (
                                        <tr key={index}><td>{index + 1}</td><td>{p.name}</td><td>{p.qtde}</td></tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                {/* Tabela de Top 5 Varejistas */}
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Top 5 Varejistas (Receita Gerada)</Card.Title>
                            <Table striped responsive>
                                <thead><tr><th>#</th><th>Varejista</th><th>Receita</th></tr></thead>
                                <tbody>
                                    {tables.topRetailers.map((r, index) => (
                                        <tr key={index}><td>{index + 1}</td><td>{r.name}</td><td>R$ {r.revenue.toFixed(2)}</td></tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

        </Container>
    );
};

export default DashboardIndustry;