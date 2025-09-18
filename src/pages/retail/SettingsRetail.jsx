// FILE: src/pages/retail/SettingsRetail.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getActorData } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { Container, Card, Form, Button, Col, Row, Alert } from 'react-bootstrap';

const SettingsRetail = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState(null);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            const retailerData = getActorData(user.actorId, 'retailer');
            setFormData(retailerData);
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split('.'); // Para campos aninhados como 'endereco.cidade'

        if (keys.length > 1) {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    ...prev[keys[0]],
                    [keys[1]]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const allRetailers = getItem('retailers');
        const updatedRetailers = allRetailers.map(r => r.id === user.actorId ? formData : r);
        setItem('retailers', updatedRetailers);
        setSuccess('Dados atualizados com sucesso!');
    };

    if (!formData) {
        return <div>Carregando...</div>;
    }

    return (
        <Container fluid>
            <h1 className="h3 mb-3">Configurações da Loja</h1>
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nome Fantasia</Form.Label>
                                    <Form.Control type="text" name="nomeFantasia" value={formData.nomeFantasia} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Razão Social</Form.Label>
                                    <Form.Control type="text" name="razaoSocial" value={formData.razaoSocial} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CNPJ</Form.Label>
                                    <Form.Control type="text" name="cnpj" value={formData.cnpj} readOnly disabled />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email de Contato</Form.Label>
                                    <Form.Control type="email" name="contato.email" value={formData.contato.email} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <hr />
                        <h5>Endereço</h5>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Logradouro</Form.Label>
                                    <Form.Control type="text" name="endereco.logradouro" value={formData.endereco.logradouro} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bairro</Form.Label>
                                    <Form.Control type="text" name="endereco.bairro" value={formData.endereco.bairro} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                             <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cidade</Form.Label>
                                    <Form.Control type="text" name="endereco.cidade" value={formData.endereco.cidade} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>UF</Form.Label>
                                    <Form.Control type="text" name="endereco.uf" value={formData.endereco.uf} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                             <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CEP</Form.Label>
                                    <Form.Control type="text" name="endereco.cep" value={formData.endereco.cep} onChange={handleInputChange} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Button variant="primary" type="submit">
                            Salvar Alterações
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SettingsRetail;