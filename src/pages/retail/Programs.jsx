// --- ARQUIVO: src/pages/retail/Programs.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este é um componente de React bastante simples. No momento, ele apenas exibe
// informações estáticas (texto fixo) sobre programas de incentivo.
// Ele serve como um "placeholder", ou seja, um espaço reservado para uma
// funcionalidade que pode se tornar mais complexa no futuro.

// Importamos o React e os componentes de layout do React Bootstrap.
import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';

// `Programs` é um componente funcional. Ele não tem estados nem lógica complexa,
// apenas retorna o JSX que deve ser desenhado na tela.
const Programs = () => {
  // O `return` define o que o componente vai renderizar.
  return (
    // `Container` do React Bootstrap para organizar o conteúdo. `fluid` faz ele ocupar toda a largura.
    <Container fluid>
      <h1 className="h3 mb-3">Programas de Incentivo</h1>
      <p>Participe de campanhas exclusivas das indústrias e ganhe prêmios.</p>
      {/* `Row` e `Col` criam um sistema de grid para alinhar os cards lado a lado. */}
      <Row>
        <Col md={4}>
          {/* `Card` é usado para mostrar cada campanha de forma organizada. */}
          <Card>
            <Card.Body>
              <Card.Title>Campanha "Verão Refrescante" da Boreal Bebidas</Card.Title>
              <Card.Text>
                Aumente em 20% a venda de refrigerantes e sucos e ganhe R$ 300 em bonificação.
              </Card.Text>
              {/* O `Card.Link` ainda não faz nada, aponta para "#". */}
              <Card.Link href="#">Ver Detalhes</Card.Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Campanha "Doce Prateleira" da DoceVida</Card.Title>
              <Card.Text>
                Compre 10 caixas de biscoitos e ganhe 1 grátis no próximo pedido.
              </Card.Text>
              <Card.Link href="#">Ver Detalhes</Card.Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Exportamos o componente para que ele possa ser usado no sistema de rotas (App.jsx).
export default Programs;
