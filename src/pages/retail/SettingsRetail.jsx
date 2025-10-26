import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getItem, setItem } from '../../state/storage';
import { Container, Card, Form, Button, Col, Row, Alert } from 'react-bootstrap';

const SettingsRetail = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.actorId) {
            try {
                // Busca diretamente na lista de retailers
                const retailers = getItem('retailers') || [];
                const retailerData = retailers.find(r => r.id === user.actorId);
                
                if (retailerData) {
                    // Garante que todos os campos necessários existem
                    setFormData({
                        id: retailerData.id,
                        nomeFantasia: retailerData.nomeFantasia || '',
                        razaoSocial: retailerData.razaoSocial || '',
                        cnpj: retailerData.cnpj || '',
                        tipo: retailerData.tipo || '',
                        contato: {
                            telefone: retailerData.contato?.telefone || '',
                            email: retailerData.contato?.email || ''
                        },
                        endereco: {
                            logradouro: retailerData.endereco?.logradouro || '',
                            bairro: retailerData.endereco?.bairro || '',
                            cidade: retailerData.endereco?.cidade || '',
                            uf: retailerData.endereco?.uf || '',
                            cep: retailerData.endereco?.cep || ''
                        }
                    });
                } else {
                    setError('Dados do varejista não encontrados.');
                }
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                setError('Erro ao carregar os dados da loja.');
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split('.');

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
        setError('');
        setSuccess('');

        try {
            const allRetailers = getItem('retailers') || [];
            const updatedRetailers = allRetailers.map(r => 
                r.id === user.actorId ? formData : r
            );
            
            setItem('retailers', updatedRetailers);
            setSuccess('Dados atualizados com sucesso!');
            
            // Limpa a mensagem de sucesso após 3 segundos
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setError('Erro ao salvar os dados. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <Container fluid>
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                </div>
            </Container>
        );
    }

    if (error && !formData) {
        return (
            <Container fluid>
                <Alert variant="danger" className="mt-3">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid>
            <h1 className="h3 mb-3">Configurações da Loja</h1>
            
            {success && (
                <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    {success}
                </Alert>
            )}
            
            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nome Fantasia</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="nomeFantasia" 
                                        value={formData?.nomeFantasia || ''} 
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Razão Social</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="razaoSocial" 
                                        value={formData?.razaoSocial || ''} 
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CNPJ</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="cnpj" 
                                        value={formData?.cnpj || ''} 
                                        readOnly 
                                        disabled 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de Estabelecimento</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="tipo" 
                                        value={formData?.tipo || ''} 
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        <h5>Contato</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Telefone</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="contato.telefone" 
                                        value={formData?.contato?.telefone || ''} 
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email de Contato</Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        name="contato.email" 
                                        value={formData?.contato?.email || ''} 
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        <h5>Endereço</h5>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Logradouro</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="endereco.logradouro" 
                                        value={formData?.endereco?.logradouro || ''} 
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bairro</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="endereco.bairro" 
                                        value={formData?.endereco?.bairro || ''} 
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cidade</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="endereco.cidade" 
                                        value={formData?.endereco?.cidade || ''} 
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>UF</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="endereco.uf" 
                                        value={formData?.endereco?.uf || ''} 
                                        onChange={handleInputChange}
                                        maxLength={2}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CEP</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="endereco.cep" 
                                        value={formData?.endereco?.cep || ''} 
                                        onChange={handleInputChange}
                                    />
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