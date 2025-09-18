// FILE: src/pages/retail/Programs.jsx
import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';

const Programs = () => {
  return (
    <Container fluid>
      <h1 className="h3 mb-3">Programas de Incentivo</h1>
      <p>Participe de campanhas exclusivas das indústrias e ganhe prêmios.</p>
      <Row>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Campanha "Verão Refrescante" da Boreal Bebidas</Card.Title>
              <Card.Text>
                Aumente em 20% a venda de refrigerantes e sucos e ganhe R$ 300 em bonificação.
              </Card.Text>
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

export default Programs;