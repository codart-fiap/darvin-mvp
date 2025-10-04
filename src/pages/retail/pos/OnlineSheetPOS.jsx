// FILE: src/pages/retail/pos/OnlineSheetPOS.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Table, Button, Alert, Card, Form } from 'react-bootstrap';
import { PlusCircleFill, Trash3Fill } from 'react-bootstrap-icons';

const OnlineSheetPOS = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState([{ productId: '', qtde: 1, error: null }]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId).filter(item => item.estoque > 0) : [], [user]);

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        newRows[index].error = null; // Limpa o erro ao modificar

        // Se o produto mudou, atualiza o preço
        if (field === 'productId') {
            const product = inventory.find(p => p.productId === value);
            newRows[index].precoUnit = product ? product.precoVenda : 0;
        }

        setRows(newRows);
    };

    const addRow = () => {
        setRows([...rows, { productId: '', qtde: 1, error: null }]);
    };

    const removeRow = (index) => {
        const newRows = rows.filter((_, i) => i !== index);
        setRows(newRows);
    };

    const validateRows = () => {
        let isValid = true;
        const newRows = [...rows];
        const productQuantities = {};

        for (let i = 0; i < newRows.length; i++) {
            const row = newRows[i];
            const product = inventory.find(p => p.productId === row.productId);
            
            if (!row.productId) {
                row.error = "Selecione um produto.";
                isValid = false;
            } else if (!product) {
                row.error = "Produto inválido.";
                isValid = false;
            } else if (isNaN(row.qtde) || row.qtde <= 0) {
                row.error = "Quantidade deve ser maior que zero.";
                isValid = false;
            } else {
                // Soma as quantidades para o mesmo produto em linhas diferentes
                productQuantities[row.productId] = (productQuantities[row.productId] || 0) + Number(row.qtde);
                if (productQuantities[row.productId] > product.estoque) {
                    row.error = `Estoque insuficiente. Disponível: ${product.estoque}`;
                    isValid = false;
                }
            }
        }
        
        if (!isValid) {
            setRows(newRows);
        }
        return isValid;
    };


    const handleRegisterSales = () => {
        setError('');
        setSuccess('');

        if (!validateRows()) {
            setError("Verifique os erros na planilha antes de continuar.");
            return;
        }

        const saleItems = rows.map(row => {
            const product = inventory.find(p => p.productId === row.productId);
            return {
                productId: product.productId,
                sku: product.sku,
                qtde: Number(row.qtde),
                precoUnit: product.precoVenda
            };
        });

        const totalLiquido = saleItems.reduce((acc, item) => acc + (item.qtde * item.precoUnit), 0);

        const newSale = {
            id: generateId(),
            retailerId: user.actorId,
            dataISO: new Date().toISOString(),
            clienteId: 'consumidor_final',
            itens: saleItems,
            totalBruto: totalLiquido,
            desconto: 0,
            totalLiquido: totalLiquido,
            formaPagamento: 'Planilha Online',
        };

        // Salvar venda e atualizar estoque
        const allSales = getItem('sales') || [];
        setItem('sales', [...allSales, newSale]);

        const currentInventory = getItem('inventory') || [];
        const updatedInventory = currentInventory.map(invItem => {
            const itemSold = saleItems.find(p => p.productId === invItem.productId);
            if (itemSold) {
                return { ...invItem, estoque: invItem.estoque - itemSold.qtde };
            }
            return invItem;
        });
        setItem('inventory', updatedInventory);

        setSuccess(`${saleItems.length} registros de venda foram agrupados e registrados com sucesso!`);
        setRows([{ productId: '', qtde: 1, error: null }]);
    };

    return (
        <Container fluid>
            <h1 className="h3 mb-3">Registrar Vendas via Planilha Online</h1>
            <Card>
                <Card.Body>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                    <Table responsive>
                        <thead>
                            <tr>
                                <th style={{width: '60%'}}>Produto</th>
                                <th style={{width: '15%'}}>Quantidade</th>
                                <th style={{width: '15%'}}>Subtotal</th>
                                <th style={{width: '10%'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    <td>
                                        <Form.Select
                                            value={row.productId}
                                            onChange={(e) => handleRowChange(index, 'productId', e.target.value)}
                                            isInvalid={!!row.error}
                                        >
                                            <option value="">Selecione um produto...</option>
                                            {inventory.map(item => (
                                                <option key={item.productId} value={item.productId}>
                                                    {item.nome} (Estoque: {item.estoque})
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">
                                            {row.error}
                                        </Form.Control.Feedback>
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={row.qtde}
                                            onChange={(e) => handleRowChange(index, 'qtde', e.target.value)}
                                            min="1"
                                        />
                                    </td>
                                    <td>
                                        R$ {( (row.precoUnit || 0) * row.qtde).toFixed(2)}
                                    </td>
                                    <td>
                                        <Button variant="danger" size="sm" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                                            <Trash3Fill />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Button variant="outline-primary" size="sm" onClick={addRow}>
                        <PlusCircleFill className="me-2" />
                        Adicionar Linha
                    </Button>
                </Card.Body>
                <Card.Footer className="text-end">
                    <Button variant="success" onClick={handleRegisterSales} disabled={rows.some(r => !r.productId)}>
                        Registrar Todas as Vendas
                    </Button>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default OnlineSheetPOS;