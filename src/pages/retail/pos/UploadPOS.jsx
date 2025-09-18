// FILE: src/pages/retail/pos/UploadPOS.jsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Card, Form, Button, Alert, Table } from 'react-bootstrap';
import * as XLSX from 'xlsx'; // Importa a biblioteca para ler planilhas

const UploadPOS = () => {
    const { user } = useAuth();
    const [parsedData, setParsedData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);

    const handleFileUpload = (e) => {
        setError('');
        setSuccess('');
        setParsedData([]);
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Validação e processamento dos dados
            processSheetData(data);
        };
        reader.readAsBinaryString(file);
    };

    const processSheetData = (data) => {
        // Assume que o cabeçalho é: SKU, Quantidade, PrecoUnitario (opcional)
        const headers = data[0].map(h => h.toString().toLowerCase());
        const skuIndex = headers.indexOf('sku');
        const qtyIndex = headers.indexOf('quantidade');

        if (skuIndex === -1 || qtyIndex === -1) {
            setError('A planilha deve conter as colunas "SKU" e "Quantidade".');
            return;
        }

        const salesToProcess = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const sku = row[skuIndex];
            const qtde = parseInt(row[qtyIndex], 10);

            const productInInventory = inventory.find(item => item.sku === sku);
            if (!productInInventory) {
                setError(`SKU "${sku}" na linha ${i + 1} não encontrado no seu estoque.`);
                return;
            }
            if (productInInventory.estoque < qtde) {
                setError(`Estoque insuficiente para "${productInInventory.nome}" na linha ${i + 1}.`);
                return;
            }
            salesToProcess.push({ ...productInInventory, qtde });
        }
        setParsedData(salesToProcess);
    };

    const handleRegisterSales = () => {
        // Para simplificar, cada linha da planilha se tornará uma venda separada
        const newSales = [];
        parsedData.forEach(item => {
            const total = item.precoSugerido * item.qtde;
            newSales.push({
                id: generateId(), retailerId: user.actorId, dataISO: new Date().toISOString(), clienteId: 'planilha_import',
                itens: [{ productId: item.productId, sku: item.sku, qtde: item.qtde, precoUnit: item.precoSugerido }],
                totalBruto: total, desconto: 0, totalLiquido: total, formaPagamento: 'Planilha',
            });
        });

        // Salva as novas vendas
        const allSales = getItem('sales') || [];
        setItem('sales', [...allSales, ...newSales]);

        // Atualiza o estoque
        const currentInventory = getItem('inventory') || [];
        const updatedInventory = currentInventory.map(invItem => {
            const itemSold = parsedData.find(p => p.productId === invItem.productId);
            if (itemSold) {
                return { ...invItem, estoque: invItem.estoque - itemSold.qtde };
            }
            return invItem;
        });
        setItem('inventory', updatedInventory);

        setSuccess(`${parsedData.length} vendas foram registradas com sucesso!`);
        setParsedData([]);
        setFileName('');
    };

    if (!user) {
        return <Container><p>Carregando...</p></Container>;
    }

    return (
        <Container fluid>
            <Card>
                <Card.Body>
                    <Card.Title>Upload de Planilha de Vendas</Card.Title>
                    <Card.Subtitle className="mb-3 text-muted">
                        Importe um arquivo .xlsx ou .csv com as colunas "SKU" e "Quantidade".
                    </Card.Subtitle>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label>Selecione o arquivo de vendas</Form.Label>
                        <Form.Control type="file" accept=".xlsx, .csv" onChange={handleFileUpload} />
                    </Form.Group>

                    {parsedData.length > 0 && (
                        <>
                            <hr />
                            <h5>Pré-visualização das Vendas</h5>
                            <p>Encontramos <strong>{parsedData.length}</strong> vendas no arquivo "{fileName}".</p>
                            <Table striped bordered hover responsive>
                                <thead><tr><th>SKU</th><th>Produto</th><th>Quantidade</th></tr></thead>
                                <tbody>
                                    {parsedData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.sku}</td>
                                            <td>{item.nome}</td>
                                            <td>{item.qtde}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="d-grid">
                                <Button onClick={handleRegisterSales}>Confirmar e Registrar Vendas</Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UploadPOS;