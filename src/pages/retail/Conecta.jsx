// FILE: src/pages/retail/Conecta.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getConectaData } from '../../state/selectors';
import { calculateRetailerRating } from '../../utils/rating';
import { setItem, getItem } from '../../state/storage';
import { generateId } from '../../utils/ids'; // ✅ fix import
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tabs,
  Tab,
  Tooltip,
  OverlayTrigger,
  ButtonGroup, // ✅ fix import
} from 'react-bootstrap';
import toast, { Toaster } from 'react-hot-toast';

const Conecta = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Para forçar a atualização dos dados

  const conectaData = useMemo(() => {
    if (!user) return null;
    return getConectaData(user.actorId);
  }, [user, refreshTrigger]);

  const rating = useMemo(() => {
    if (!user) return null;
    return calculateRetailerRating(user.actorId);
  }, [user, refreshTrigger]);

  if (!user || !conectaData || !rating) {
    return <div>Carregando...</div>;
  }

  const ratingTooltip = (props) => (
    <Tooltip id="rating-tooltip" {...props}>
      Seu rating de qualidade de dados (Bronze a Diamante) é calculado com base na
      consistência e riqueza das suas informações de vendas e estoque.
    </Tooltip>
  );

  return (
    <Container fluid>
      <Toaster position="top-right" />
      {/* Cabeçalho e KPIs */}
      <div className="mb-4">
        <h1 className="h3">Darvin Conecta</h1>
        <p className="text-muted">
          Monetize seus dados com segurança, escolhendo propostas de indústrias ou
          participando de Fundos de Dados.
        </p>
      </div>

      <Row className="mb-4">
        <Col>
          <Card body className="text-center">
            <h5>Propostas Recebidas</h5>
            <p className="h4">{conectaData.kpis.proposalCount}</p>
          </Card>
        </Col>
        <Col>
          <Card body className="text-center">
            <h5>Total Monetizado</h5>
            <p className="h4">R$ {conectaData.kpis.totalMonetized.toFixed(2)}</p>
          </Card>
        </Col>
        <Col>
          <Card body className="text-center">
            <h5>Seu Rating</h5>
            <p className="h4">
              <OverlayTrigger placement="top" overlay={ratingTooltip}>
                <Badge bg="info">{rating.name}</Badge>
              </OverlayTrigger>
            </p>
          </Card>
        </Col>
      </Row>

      {/* Navegação em Abas */}
      <Tabs defaultActiveKey="individuais" id="conecta-tabs" className="mb-3">
        <Tab eventKey="individuais" title="Propostas Individuais">
          <IndividualProposalsTab
            proposals={conectaData.individualProposals}
            onAction={() => setRefreshTrigger((t) => t + 1)}
          />
        </Tab>
        <Tab eventKey="fundos" title="Fundos de Dados">
          <DataFundsTab funds={conectaData.dataFunds} />
        </Tab>
      </Tabs>
    </Container>
  );
};

// Sub-componente para a aba de Propostas Individuais
const IndividualProposalsTab = ({ proposals, onAction }) => {
  const [filter, setFilter] = useState('Todas');
  const filteredProposals = useMemo(() => {
    if (filter === 'Todas') return proposals;
    return proposals.filter((p) => p.status === filter.toLowerCase());
  }, [proposals, filter]);

  const handleProposalAction = (proposalId, newStatus) => {
    const allProposals = getItem('proposals') || [];
    const updatedProposals = allProposals.map((p) =>
      p.id === proposalId ? { ...p, status: newStatus } : p
    );
    setItem('proposals', updatedProposals);

    if (newStatus === 'aceita') {
      const proposal = allProposals.find((p) => p.id === proposalId);
      const allTransactions = getItem('transactions') || [];
      const liquido = proposal.valorOfertadoBRL * (1 - 0.06);
      const newTransaction = {
        id: generateId(),
        destino: { type: 'retailer', id: proposal.targetId },
        liquido,
        createdAt: new Date().toISOString(),
      };
      setItem('transactions', [...allTransactions, newTransaction]);
      toast.success(`Proposta aceita com sucesso!`);
    } else {
      toast.error(`Proposta recusada.`);
    }
    onAction(); // Notifica o componente pai para recarregar os dados
  };

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <ButtonGroup>
          {['Todas', 'Pendentes', 'Aceitas', 'Recusadas'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'outline-primary'}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <Row>
        {filteredProposals.map((p) => (
          <Col md={4} key={p.id} className="mb-3">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Subtitle className="text-muted mb-2">{p.industryName}</Card.Subtitle>
                <Card.Title>Oferta de R$ {p.valorOfertadoBRL.toFixed(2)}</Card.Title>
                <Card.Text>{p.descricao}</Card.Text>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      <Badge bg="primary">{p.status?.toUpperCase() ?? 'N/A'}</Badge>
                    </span>
                    <small className="text-muted">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString('pt-BR')
                        : 'Data não disponível'}
                    </small>
                  </div>
                  {p.status === 'pendente' && (
                    <div className="d-grid gap-2 mt-3">
                      <Button
                        variant="success"
                        onClick={() => handleProposalAction(p.id, 'aceita')}
                      >
                        Aceitar
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={() => handleProposalAction(p.id, 'recusada')}
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

// Sub-componente para a aba de Fundos de Dados
const DataFundsTab = ({ funds }) => {
  return (
    <Card>
      <Card.Body>
        <div className="mb-4">
          <h4>O que são Fundos de Dados?</h4>
          <p>
            Fundos de Dados são uma forma de varejistas se unirem em grupos para venderem
            suas informações de forma coletiva. Ao agrupar os dados, o volume se torna mais
            valioso e atrativo para as indústrias, resultando em propostas de maior valor.
            Os lucros são divididos proporcionalmente entre os membros.
          </p>
        </div>
        <Row>
          {funds.map((fund) => (
            <Col md={6} key={fund.id} className="mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>{fund.nome ?? 'Fundo sem nome'}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {fund.categoriaPrincipal ?? 'Categoria não definida'}
                  </Card.Subtitle>
                  <hr />
                  <p>
                    <strong>Última proposta recebida:</strong>{' '}
                    {fund.ultimaPropostaValor !== undefined
                      ? `R$ ${fund.ultimaPropostaValor.toFixed(2)}`
                      : 'Nenhuma proposta ainda'}
                  </p>
                  <p>
                    <strong>Membros:</strong> {fund.membrosCount ?? 0}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <Badge bg={fund.status === 'Aberto' ? 'success' : 'secondary'}>
                      {fund.status ?? 'Indefinido'}
                    </Badge>
                  </p>
                  <Button disabled={fund.status !== 'Aberto'}>Participar do Fundo</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Conecta;
