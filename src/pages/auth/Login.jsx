// --- ARQUIVO: src/pages/auth/Login.jsx ---

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getActorsByType } from '../../state/selectors'; // ✅ Importa a nova função
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';

const Login = () => {
  // ✅ Estados de email e senha removidos
  const [role, setRole] = useState('retail');
  const [actors, setActors] = useState([]); // ✅ Estado para a lista de estabelecimentos
  const [selectedActorId, setSelectedActorId] = useState(''); // ✅ Estado para o estabelecimento selecionado
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // A função `login` agora é a nova versão

  // ✅ Efeito que busca os estabelecimentos sempre que o "role" muda
  useEffect(() => {
    const actorData = getActorsByType(role);
    setActors(actorData);
    setSelectedActorId(''); // Limpa a seleção anterior
  }, [role]);


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedActorId) {
        setError('Por favor, selecione um estabelecimento para continuar.');
        return;
    }

    // ✅ Chama a nova função de login, passando o ID do estabelecimento e o perfil
    const user = login(selectedActorId, role);

    if (user) {
      // Redireciona para o dashboard correspondente
      switch (user.role) {
        case 'retail':
          navigate('/retail/dashboard');
          break;
        case 'industry':
          navigate('/industry/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError('Não foi possível fazer login. Nenhum usuário encontrado para este estabelecimento.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">DARVIN MVP</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            {/* 1. SELETOR DE TIPO DE USUÁRIO */}
            <Form.Group id="role" className="mb-3">
              <Form.Label>1. Selecione o tipo de perfil</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="retail">Varejo/Comércio</option>
                <option value="industry">Indústria</option>
              </Form.Select>
            </Form.Group>

            {/* 2. SELETOR DE ESTABELECIMENTO */}
            <Form.Group id="actor" className="mb-3">
              <Form.Label>2. Selecione o estabelecimento</Form.Label>
              <Form.Select 
                value={selectedActorId} 
                onChange={(e) => setSelectedActorId(e.target.value)}
                disabled={actors.length === 0} // Desabilitado se não houver opções
              >
                <option value="">Selecione...</option>
                {actors.map(actor => (
                  <option key={actor.id} value={actor.id}>
                    {actor.nomeFantasia}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Campos de email e senha foram removidos */}

            <Button className="w-100" type="submit" disabled={!selectedActorId}>
              Entrar
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;