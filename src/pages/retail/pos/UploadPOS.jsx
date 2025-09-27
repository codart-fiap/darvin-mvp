// --- ARQUIVO: src/pages/retail/pos/UploadPOS.jsx ---
// --- TECNOLOGIA: React, JSX, JavaScript ---
// Este componente de React permite que o usuário faça o upload de um arquivo de planilha
// (Excel ou CSV) para registrar várias vendas de uma só vez.

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Card, Form, Button, Alert, Table } from 'react-bootstrap';
// Importamos a biblioteca 'xlsx' que é especialista em ler e escrever arquivos de planilha.
import * as XLSX from 'xlsx';

// Definição do componente funcional `UploadPOS`.
const UploadPOS = () => {
    // Pegamos os dados do usuário logado usando nosso hook de autenticação.
    const { user } = useAuth();
    // --- ESTADOS DO COMPONENTE ---
    // `useState` é um hook do React para criar "estados", que são variáveis que,
    // quando alteradas, fazem o componente se redesenhar na tela.
    const [parsedData, setParsedData] = useState([]); // Guarda os dados lidos da planilha.
    const [fileName, setFileName] = useState(''); // Guarda o nome do arquivo enviado.
    const [error, setError] = useState(''); // Guarda mensagens de erro para o usuário.
    const [success, setSuccess] = useState(''); // Guarda mensagens de sucesso.

    // `useMemo` é um hook de otimização. Ele "memoriza" o resultado de uma função.
    // O inventário só será recalculado se `user` mudar, evitando trabalho desnecessário.
    const inventory = useMemo(() => user ? getInventoryByRetailer(user.actorId) : [], [user]);

    // Função chamada quando o usuário seleciona um arquivo no campo de upload.
    const handleFileUpload = (e) => {
        // Limpamos os estados anteriores.
        setError('');
        setSuccess('');
        setParsedData([]);
        const file = e.target.files[0]; // Pega o primeiro arquivo selecionado.
        if (!file) return; // Se nenhum arquivo foi selecionado, não faz nada.

        setFileName(file.name);
        // O `FileReader` é uma API do navegador para ler o conteúdo de arquivos.
        const reader = new FileReader();
        // `onload` é o evento que dispara quando o arquivo terminar de ser lido.
        reader.onload = (evt) => {
            const bstr = evt.target.result; // O conteúdo do arquivo.
            // A biblioteca `XLSX` lê o conteúdo do arquivo.
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0]; // Pega o nome da primeira aba da planilha.
            const ws = wb.Sheets[wsname];
            // Converte a aba da planilha em um array de arrays (JSON).
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Chamamos nossa função para validar e processar esses dados.
            processSheetData(data);
        };
        // Inicia a leitura do arquivo.
        reader.readAsBinaryString(file);
    };

    // Função que valida os dados lidos da planilha.
    const processSheetData = (data) => {
        // Pega a primeira linha (cabeçalho) e converte para minúsculas.
        const headers = data[0].map(h => h.toString().toLowerCase());
        // Encontra a posição (índice) das colunas 'sku' e 'quantidade'.
        const skuIndex = headers.indexOf('sku');
        const qtyIndex = headers.indexOf('quantidade');

        // Se não encontrar as colunas necessárias, define um erro.
        if (skuIndex === -1 || qtyIndex === -1) {
            setError('A planilha deve conter as colunas "SKU" e "Quantidade".');
            return;
        }

        const salesToProcess = [];
        // Percorre as linhas da planilha, começando da segunda (a primeira é o cabeçalho).
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const sku = row[skuIndex];
            const qtde = parseInt(row[qtyIndex], 10);

            // Validações: o produto existe? Tem estoque suficiente?
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
        // Se tudo estiver OK, salva os dados processados no estado para pré-visualização.
        setParsedData(salesToProcess);
    };

    // Função chamada quando o usuário clica no botão para confirmar as vendas.
    const handleRegisterSales = () => {
        const newSales = [];
        // Cria um registro de venda para cada linha da planilha.
        parsedData.forEach(item => {
            // ... (cria o objeto de venda)
        });

        // Salva as novas vendas no localStorage.
        const allSales = getItem('sales') || [];
        setItem('sales', [...allSales, ...newSales]);

        // Atualiza o estoque, subtraindo as quantidades vendidas.
        const currentInventory = getItem('inventory') || [];
        const updatedInventory = currentInventory.map(invItem => {
            const itemSold = parsedData.find(p => p.productId === invItem.productId);
            if (itemSold) {
                return { ...invItem, estoque: invItem.estoque - itemSold.qtde };
            }
            return invItem;
        });
        setItem('inventory', updatedInventory);

        // Limpa a tela e mostra uma mensagem de sucesso.
        setSuccess(`${parsedData.length} vendas foram registradas com sucesso!`);
        setParsedData([]);
        setFileName('');
    };
    
    // Se ainda não temos a informação do usuário, mostramos uma mensagem de carregamento.
    if (!user) {
        return <Container><p>Carregando...</p></Container>;
    }

    // --- RENDERIZAÇÃO DO COMPONENTE ---
    // O que este componente irá desenhar na tela. Usa componentes do React Bootstrap.
    return (
        <Container fluid>
            <Card>
                <Card.Body>
                    <Card.Title>Upload de Planilha de Vendas</Card.Title>
                    <Card.Subtitle className="mb-3 text-muted">
                        Importe um arquivo .xlsx ou .csv com as colunas "SKU" e "Quantidade".
                    </Card.Subtitle>

                    {/* Mostra alertas de erro ou sucesso, se existirem */}
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {/* O campo de formulário para o upload do arquivo */}
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label>Selecione o arquivo de vendas</Form.Label>
                        <Form.Control type="file" accept=".xlsx, .csv" onChange={handleFileUpload} />
                    </Form.Group>

                    {/* A pré-visualização só aparece se houver dados processados */}
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
