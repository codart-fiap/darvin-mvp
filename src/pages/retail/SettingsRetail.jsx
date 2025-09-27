// --- ARQUIVO: src/pages/retail/SettingsRetail.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este componente de React cria um formulário para que o usuário do tipo "varejo"
// possa ver e editar as informações da sua loja.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getActorData } from '../../state/selectors';
import { getItem, setItem } from '../../state/storage';
import { Container, Card, Form, Button, Col, Row, Alert } from 'react-bootstrap';

// Definição do componente funcional `SettingsRetail`.
const SettingsRetail = () => {
    // Pegamos os dados do usuário logado do nosso hook.
    const { user } = useAuth();
    // --- ESTADOS DO COMPONENTE ---
    // `formData` vai guardar os dados do formulário (as informações da loja).
    const [formData, setFormData] = useState(null);
    // `success` vai guardar a mensagem de sucesso para mostrar ao usuário.
    const [success, setSuccess] = useState('');

    // `useEffect` é um hook que executa um "efeito colateral".
    // Este efeito será executado quando o componente for montado na tela e sempre que `user` mudar.
    useEffect(() => {
        // Se já temos a informação do usuário...
        if (user) {
            // ...buscamos os dados completos da loja usando o `actorId` do usuário.
            const retailerData = getActorData(user.actorId, 'retailer');
            // E atualizamos o estado `formData` com esses dados, preenchendo o formulário.
            setFormData(retailerData);
        }
    }, [user]); // A lista de dependências `[user]` diz ao React para re-executar este efeito se `user` mudar.

    // Função para lidar com mudanças nos campos do formulário.
    const handleInputChange = (e) => {
        // `name` é o nome do campo (ex: 'nomeFantasia' ou 'endereco.cidade').
        // `value` é o novo texto digitado pelo usuário.
        const { name, value } = e.target;
        const keys = name.split('.'); // Separa o nome se for um campo aninhado.

        // Se `keys.length` for maior que 1, é um campo aninhado (como 'endereco.cidade').
        if (keys.length > 1) {
            // Atualizamos o estado de forma mais complexa para objetos aninhados.
            setFormData(prev => ({ // `prev` é o valor anterior do estado.
                ...prev, // Copia todas as propriedades do objeto principal.
                [keys[0]]: { // Acessa a chave aninhada (ex: 'endereco').
                    ...prev[keys[0]], // Copia todas as propriedades do objeto aninhado.
                    [keys[1]]: value // Atualiza a propriedade específica (ex: 'cidade').
                }
            }));
        } else {
            // Se for um campo simples, a atualização é mais direta.
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Função chamada quando o formulário é enviado (clique no botão "Salvar").
    const handleSubmit = (e) => {
        e.preventDefault(); // Previne o comportamento padrão do navegador de recarregar a página.
        // Pega a lista completa de varejistas do localStorage.
        const allRetailers = getItem('retailers');
        // Cria uma nova lista, substituindo os dados do varejista atual pelos dados do formulário.
        const updatedRetailers = allRetailers.map(r => r.id === user.actorId ? formData : r);
        // Salva a nova lista de volta no localStorage.
        setItem('retailers', updatedRetailers);
        // Define a mensagem de sucesso.
        setSuccess('Dados atualizados com sucesso!');
    };
    
    // Se `formData` ainda for `null` (ou seja, os dados ainda não foram carregados),
    // mostramos uma mensagem de "Carregando...".
    if (!formData) {
        return <div>Carregando...</div>;
    }

    // --- RENDERIZAÇÃO DO COMPONENTE ---
    return (
        <Container fluid>
            <h1 className="h3 mb-3">Configurações da Loja</h1>
            {/* Mostra o alerta de sucesso se a mensagem existir */}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
            <Card>
                <Card.Body>
                    {/* O `Form` do React Bootstrap que chama `handleSubmit` ao ser enviado */}
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            {/* Cada campo do formulário é um `Form.Group` com `Form.Label` e `Form.Control` */}
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

