// FILE: src/pages/retail/DashboardRetail.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardData, getRetailerInsights } from '../../state/selectors';
import { Container, Row, Col, Card, ButtonGroup, Button, Table, Alert, Badge } from 'react-bootstrap';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BoxSeam, ExclamationCircle, GraphUpArrow, GraphDownArrow } from 'react-bootstrap-icons';

const COLORS = ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754'];
const ICONS = { BoxSeam, ExclamationCircle, GraphUpArrow, GraphDownArrow };

const DashboardRetail = () => {
    const { user } = useAuth();
    const [period, setPeriod] = useState(30);
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [dateFilter, setDateFilter] = useState(null); // <-- NOVO ESTADO PARA FILTRO DE DATA

    const dashboardData = useMemo(() => {
        if (!user) return null;
        // Passa ambos os filtros para o seletor
        return getDashboardData(user.actorId, period, categoryFilter, dateFilter);
    }, [user, period, categoryFilter, dateFilter]);

    // Busca os dados para o Assistente de Performance
    const insights = useMemo(() => {
        if (!user) return [];
        return getRetailerInsights(user.actorId);
    }, [user]);

    if (!dashboardData) {
        return <div>Carregando...</div>;
    }

    const { kpis, charts, tables } = dashboardData;
    const renderCustomizedLabel = ({ value }) => { return `R$${value.toFixed(2)}`; };

    // Função para lidar com o clique no gráfico de pizza
    const handlePieClick = (data) => {
        const category = data.name;
        setCategoryFilter(prev => prev === category ? null : category);
    };

    // <-- NOVA FUNÇÃO PARA CLIQUE NO GRÁFICO DE BARRAS -->
    const handleBarClick = (data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const date = data.activePayload[0].payload.name;
            setDateFilter(prev => prev === date ? null : date);
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0 d-inline-block me-3">Dashboard</h1>
                    {/* Indicador de filtro de categoria */}
                    {categoryFilter && (
                        <Badge pill bg="info" as="button" onClick={() => setCategoryFilter(null)} className="border-0 me-2">
                            Categoria: {categoryFilter} &times;
                        </Badge>
                    )}
                    {/* NOVO: Indicador de filtro de data */}
                    {dateFilter && (
                        <Badge pill bg="secondary" as="button" onClick={() => setDateFilter(null)} className="border-0">
                            Data: {dateFilter} &times;
                        </Badge>
                    )}
                </div>
                <ButtonGroup>
                    <Button variant={period === 7 ? 'primary' : 'outline-primary'} onClick={() => setPeriod(7)}>7 Dias</Button>
                    <Button variant={period === 30 ? 'primary' : 'outline-primary'} onClick={() => setPeriod(30)}>30 Dias</Button>
                    <Button variant={period === 90 ? 'primary' : 'outline-primary'} onClick={() => setPeriod(90)}>90 Dias</Button>
                </ButtonGroup>
            </div>
            
            <Row>
                <Col md={4} className="mb-3"><Card body className="text-center"><h5>Receita Total</h5><p className="h4">R$ {kpis.totalRevenue.toFixed(2)}</p></Card></Col>
                <Col md={4} className="mb-3"><Card body className="text-center"><h5>Vendas Realizadas</h5><p className="h4">{kpis.numberOfSales}</p></Card></Col>
                <Col md={4} className="mb-3"><Card body className="text-center"><h5>Ticket Médio</h5><p className="h4">R$ {kpis.averageTicket.toFixed(2)}</p></Card></Col>
            </Row>

            {/* --- SEÇÃO DO ASSISTENTE ATUALIZADA --- */}
            <Row className="mt-2">
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title as="h6" className="text-muted mb-3">Assistente de Performance</Card.Title>
                            {insights.length > 0 ? (
                                <>
                                    {insights.slice(0, 2).map((insight, index) => {
                                        const IconComponent = ICONS[insight.icon];
                                        return (
                                            <Alert key={index} variant={insight.type} className="d-flex align-items-center mb-2">
                                                {IconComponent && <IconComponent className="me-3" size={24} />}
                                                {insight.text}
                                            </Alert>
                                        );
                                    })}
                                    {insights.length > 2 && (
                                        <div className="text-end mt-2">
                                            <Link to="/retail/assistant">
                                                Ver mais {insights.length - 2} insight(s)...
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : <p className="text-muted mb-0">Nenhum insight para exibir no momento.</p>}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {/* --- FIM DA SEÇÃO --- */}

            <Row className="mt-4">
                <Col>
                    <Card>
                        <Card.Body>
                            <Card.Title>Receita por Dia</Card.Title>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={charts.salesByDay} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                    <Bar dataKey="Receita" fill="var(--primary-color)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <Row className="mt-4">
                <Col md={7}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Top 5 Produtos Mais Vendidos</Card.Title>
                            <Table striped responsive>
                                <thead><tr><th>Produto</th><th>Marca</th><th>Quantidade Vendida</th></tr></thead>
                                <tbody>
                                    {tables.top5Products.map((p, index) => (
                                        <tr key={index}>
                                            <td>{p.name}</td>
                                            <td><small className="text-muted">{p.marca}</small></td>
                                            <td>{p.qtde}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={5}>
                     <Card>
                        <Card.Body>
                            <Card.Title>Receita por Categoria</Card.Title>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie 
                                      data={charts.revenueByCategory} 
                                      dataKey="Receita" 
                                      nameKey="name" 
                                      cx="50%" 
                                      cy="50%" 
                                      outerRadius={80} 
                                      labelLine={false} 
                                      label={renderCustomizedLabel}
                                      onClick={handlePieClick}
                                      style={{ cursor: 'pointer' }}
                                    >
                                        {charts.revenueByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardRetail;