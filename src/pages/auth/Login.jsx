// FILE: src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('retail'); // 'retail' como padrão
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = login(email, password, role);

    if (user) {
      // Redireciona para o dashboard correspondente
      switch (user.role) {
        case 'retail':
          navigate('/retail/dashboard');
          break;
        case 'supplier':
          navigate('/supplier/dashboard');
          break;
        case 'industry':
          navigate('/industry/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError('Credenciais inválidas ou tipo de usuário incorreto.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">DARVIN MVP</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="role" className="mb-3">
              <Form.Label>Tipo de Usuário</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="retail">Varejo/Comércio</option>
                <option value="supplier">Fornecedor</option>
                <option value="industry">Indústria</option>
              </Form.Select>
            </Form.Group>

            <Form.Group id="email" className="mb-3">
              <Form.Label>Usuário (email)</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>

            <Form.Group id="password"  className="mb-3">
              <Form.Label>Senha</Form.Label>
              <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Form.Group>

            <Button className="w-100" type="submit">Entrar</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;