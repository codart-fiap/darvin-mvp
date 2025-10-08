import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, getClientsByRetailer } from '../../../state/selectors';
import { setItem, getItem } from '../../../state/storage';
import { generateId } from '../../../utils/ids';
import { Container, Row, Col, Card, Button, Table, Alert, Badge, Form, Modal, ProgressBar, ListGroup } from 'react-bootstrap';
import { CloudUpload, FileEarmarkSpreadsheet, CheckCircleFill, XCircleFill, ExclamationTriangleFill, Trash3Fill, EyeFill, Download, InfoCircleFill } from 'react-bootstrap-icons';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const UploadPOS = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const inventory = useMemo(() => {
        if (!user) return [];
        return getInventoryByRetailer(user.actorId);
    }, [user, lastUpdated]);

    const clients = useMemo(() => {
        if (!user) return [];
        return getClientsByRetailer(user.actorId);
    }, [user, lastUpdated]);

    // Normaliza texto para comparação
    const normalizeText = (text) => {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/\s+/g, ' ');
    };

    // Busca produto por SKU ou nome
    const findProduct = useCallback((sku, nome) => {
        if (!sku && !nome) return null;

        if (sku) {
            const normalizedSku = normalizeText(sku);
            const bySku = inventory.find(item => 
                normalizeText(item.sku) === normalizedSku
            );
            if (bySku) return bySku;
        }

        if (nome) {
            const normalizedNome = normalizeText(nome);
            const byName = inventory.find(item => 
                normalizeText(item.nome).includes(normalizedNome) ||
                normalizedNome.includes(normalizeText(item.nome))
            );
            if (byName) return byName;
        }

        return null;
    }, [inventory]);

    // Busca cliente
    const findClient = useCallback((clienteInfo) => {
        if (!clienteInfo || !user) return 'consumidor_final_' + user.actorId;
        
        const normalized = normalizeText(clienteInfo);
        
        if (normalized.includes('consumidor') || normalized.includes('final') || normalized === '') {
            return 'consumidor_final_' + user.actorId;
        }

        const client = clients.find(c => 
            normalizeText(c.nome).includes(normalized) ||
            normalized.includes(normalizeText(c.nome))
        );

        return client?.id || 'consumidor_final_' + user.actorId;
    }, [clients, user]);

    // Processa CSV
    const processCSV = useCallback((file) => {
        return new Promise((resolve) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
                complete: (result) => resolve(result.data),
                error: () => resolve([])
            });
        });
    }, []);

    // Processa Excel
    const processExcel = useCallback((file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                        raw: false,
                        defval: ''
                    });
                    resolve(jsonData);
                } catch (error) {
                    console.error('Erro ao processar Excel:', error);
                    resolve([]);
                }
            };

            reader.onerror = () => resolve([]);
            reader.readAsArrayBuffer(file);
        });
    }, []);

    // Identifica colunas
    const identifyColumns = useCallback((headers) => {
        const normalizedHeaders = headers.map(h => normalizeText(h));
        
        const columnMap = {
            sku: null,
            produto: null,
            quantidade: null,
            preco: null,
            data: null,
            cliente: null,
            pagamento: null
        };

        const skuPatterns = ['sku', 'codigo', 'cod', 'ref', 'referencia'];
        columnMap.sku = headers.find((h, i) => 
            skuPatterns.some(p => normalizedHeaders[i].includes(p))
        );

        const produtoPatterns = ['produto', 'nome', 'descricao', 'item', 'mercadoria'];
        columnMap.produto = headers.find((h, i) => 
            produtoPatterns.some(p => normalizedHeaders[i].includes(p))
        );

        const qtdePatterns = ['quantidade', 'qtde', 'qtd', 'unidade', 'und', 'qty'];
        columnMap.quantidade = headers.find((h, i) => 
            qtdePatterns.some(p => normalizedHeaders[i].includes(p))
        );

        const precoPatterns = ['preco', 'valor', 'price', 'vl'];
        columnMap.preco = headers.find((h, i) => 
            precoPatterns.some(p => normalizedHeaders[i].includes(p))
        );

        const dataPatterns = ['data', 'date', 'dia'];
        columnMap.data = headers.find((h, i) => 
            dataPatterns.some(p => normalizedHeaders[i].includes(p))
        );

        const clientePatterns = ['cliente', 'comprador', 'customer'];
        columnMap.cliente = headers.find((h, i) => 
            clientePatterns.some(p => normalizedHeaders[i].includes(p))
        );

        const pagamentoPatterns = ['pagamento', 'forma', 'payment'];
        columnMap.pagamento = headers.find((h, i) => 
            pagamentoPatterns.some(p => normalizedHeaders[i].includes(p))
        );

        return columnMap;
    }, []);

    // Converte valor monetário
    const parseMoneyValue = (value) => {
        if (!value) return 0;
        const cleaned = value.toString().replace(/[^\d,.-]/g, '');
        const normalized = cleaned.replace(',', '.');
        return parseFloat(normalized) || 0;
    };

    // Processa dados extraídos
    const processExtractedData = useCallback((rawData, fileName) => {
        if (!rawData || rawData.length === 0) {
            return {
                fileName,
                success: false,
                error: 'Nenhum dado encontrado na planilha'
            };
        }

        const headers = Object.keys(rawData[0]);
        const columnMap = identifyColumns(headers);

        const processedRows = [];
        let foundCount = 0;
        let notFoundCount = 0;
        let warnings = [];

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            
            const sku = row[columnMap.sku] || '';
            const nome = row[columnMap.produto] || '';
            const quantidade = parseInt(row[columnMap.quantidade]) || 1;
            const precoInfo = row[columnMap.preco] || '';
            const dataInfo = row[columnMap.data] || new Date().toISOString();
            const clienteInfo = row[columnMap.cliente] || '';
            const pagamentoInfo = row[columnMap.pagamento] || 'Não informado';

            if (!sku && !nome) continue;

            const product = findProduct(sku, nome);

            if (product) {
                const preco = precoInfo ? parseMoneyValue(precoInfo) : product.avgPrice;
                const hasStock = product.totalStock >= quantidade;
                
                if (!hasStock) {
                    warnings.push(`Linha ${i + 2}: Estoque insuficiente para "${product.nome}" (disponível: ${product.totalStock}, solicitado: ${quantidade})`);
                }

                processedRows.push({
                    linha: i + 2,
                    sku: product.sku,
                    nome: product.nome,
                    quantidade,
                    precoUnitario: preco,
                    subtotal: preco * quantidade,
                    productId: product.productId,
                    data: dataInfo,
                    cliente: findClient(clienteInfo),
                    pagamento: pagamentoInfo,
                    found: true,
                    hasStock
                });
                foundCount++;
            } else {
                processedRows.push({
                    linha: i + 2,
                    sku: sku || 'N/A',
                    nome: nome || 'Produto não identificado',
                    quantidade,
                    precoUnitario: parseMoneyValue(precoInfo),
                    subtotal: 0,
                    productId: null,
                    data: dataInfo,
                    cliente: findClient(clienteInfo),
                    pagamento: pagamentoInfo,
                    found: false,
                    hasStock: false
                });
                notFoundCount++;
                warnings.push(`Linha ${i + 2}: Produto "${nome || sku}" não encontrado no estoque`);
            }
        }

        const validRows = processedRows.filter(r => r.found && r.hasStock);
        const total = validRows.reduce((sum, r) => sum + r.subtotal, 0);

        return {
            fileName,
            totalLinhas: rawData.length,
            linhasProcessadas: processedRows.length,
            produtosEncontrados: foundCount,
            produtosNaoEncontrados: notFoundCount,
            valorTotal: total,
            columnMap,
            rows: processedRows,
            warnings,
            success: foundCount > 0,
            canImport: validRows.length > 0
        };
    }, [findProduct, findClient, identifyColumns]);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['csv', 'xlsx', 'xls'].includes(ext) && file.size < 10 * 1024 * 1024;
        });

        if (validFiles.length !== selectedFiles.length) {
            alert('Alguns arquivos foram ignorados. Apenas CSV, XLSX e XLS até 10MB são aceitos.');
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setResults(prev => prev.filter((_, i) => i !== index));
    };

    const processFiles = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setResults([]);

        const processedResults = [];

        for (const file of files) {
            const ext = file.name.split('.').pop().toLowerCase();
            let rawData = [];

            if (ext === 'csv') {
                rawData = await processCSV(file);
            } else if (ext === 'xlsx' || ext === 'xls') {
                rawData = await processExcel(file);
            }

            const result = processExtractedData(rawData, file.name);
            processedResults.push(result);
            setResults([...processedResults]);
        }

        setProcessing(false);
    };

    const handlePreview = (data) => {
        setPreviewData(data);
        setShowPreview(true);
    };

    const handleImportSales = (resultData) => {
        const validRows = resultData.rows.filter(r => r.found && r.hasStock);

        if (validRows.length === 0) {
            alert('Nenhuma venda válida para importar.');
            return;
        }

        const salesGroups = {};
        validRows.forEach(row => {
            const key = `${row.data}_${row.cliente}_${row.pagamento}`;
            if (!salesGroups[key]) {
                salesGroups[key] = {
                    data: row.data,
                    cliente: row.cliente,
                    pagamento: row.pagamento,
                    itens: []
                };
            }
            salesGroups[key].itens.push(row);
        });

        const allSales = getItem('sales') || [];
        let currentInventory = getItem('inventory') || [];
        let salesImported = 0;

        Object.values(salesGroups).forEach(group => {
            const saleItems = group.itens.map(item => ({
                productId: item.productId,
                sku: item.sku,
                qtde: item.quantidade,
                precoUnit: item.precoUnitario
            }));

            const totalBruto = saleItems.reduce((sum, i) => sum + (i.qtde * i.precoUnit), 0);

            const newSale = {
                id: generateId(),
                retailerId: user.actorId,
                dataISO: group.data,
                clienteId: group.cliente,
                itens: saleItems,
                totalBruto,
                desconto: 0,
                totalLiquido: totalBruto,
                formaPagamento: group.pagamento,
                observacao: `Importado de ${resultData.fileName}`
            };

            allSales.push(newSale);

            for (const item of saleItems) {
                let quantityToDeduct = item.qtde;
                const productBatches = currentInventory
                    .filter(inv => inv.productId === item.productId && inv.estoque > 0)
                    .sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade));

                for (const batch of productBatches) {
                    if (quantityToDeduct === 0) break;
                    const deductAmount = Math.min(quantityToDeduct, batch.estoque);
                    batch.estoque -= deductAmount;
                    quantityToDeduct -= deductAmount;
                }
            }

            salesImported++;
        });

        setItem('sales', allSales);
        setItem('inventory', currentInventory);

        alert(`✅ ${salesImported} venda(s) importada(s) com sucesso!\n${validRows.length} produto(s) registrado(s).`);
        
        setFiles([]);
        setResults([]);
        setLastUpdated(Date.now());
    };

    const downloadTemplate = () => {
        const template = [
            ['SKU', 'Produto', 'Quantidade', 'Preço', 'Data', 'Cliente', 'Forma de Pagamento'],
            ['BEB0001', 'Refrigerante Boreal Cola 2L', '2', '10.50', '2025-10-08', 'João Silva', 'Dinheiro'],
            ['ALI0001', 'Biscoito DoceVida Chocolate', '5', '4.50', '2025-10-08', 'Consumidor Final', 'PIX'],
            ['', 'Macarrão DoceVida Espaguete', '3', '', '2025-10-08', '', 'Cartão de Crédito']
        ];

        const ws = XLSX.utils.aoa_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
        XLSX.writeFile(wb, 'modelo_vendas_darvin.xlsx');
    };

    if (!user) return <Container><div className="text-center py-5">Carregando...</div></Container>;

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">Upload de Planilhas</h1>
                    <p className="text-muted mb-0">Importe vendas em lote de arquivos CSV ou Excel</p>
                </div>
            </div>

            <Row>
                <Col lg={8}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <div className="text-center py-5">
                                <CloudUpload size={72} className="text-primary mb-3" />
                                <h5 className="mb-2">Arraste seus arquivos aqui</h5>
                                <p className="text-muted mb-3">ou clique para selecionar</p>
                                <p className="small text-muted mb-4">
                                    <Badge bg="secondary" className="me-2">CSV</Badge>
                                    <Badge bg="secondary" className="me-2">XLSX</Badge>
                                    <Badge bg="secondary">XLS</Badge>
                                    <span className="ms-2">• Máximo 10MB por arquivo</span>
                                </p>
                                
                                <Form.Control
                                    type="file"
                                    multiple
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="mb-3"
                                    style={{ maxWidth: '400px', margin: '0 auto' }}
                                />

                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    onClick={downloadTemplate}
                                >
                                    <Download className="me-2" />
                                    Baixar Modelo de Planilha
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {files.length > 0 && (
                        <Card className="mb-4 shadow-sm">
                            <Card.Header className="bg-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <strong>Arquivos Selecionados</strong>
                                    <Badge bg="primary" pill>{files.length}</Badge>
                                </div>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {files.map((file, index) => (
                                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <FileEarmarkSpreadsheet size={24} className="text-success me-3" />
                                            <div>
                                                <div><strong>{file.name}</strong></div>
                                                <small className="text-muted">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </small>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            disabled={processing}
                                        >
                                            <Trash3Fill />
                                        </Button>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                            <Card.Footer className="bg-white text-end">
                                <Button 
                                    variant="primary"
                                    onClick={processFiles}
                                    disabled={processing}
                                    size="lg"
                                >
                                    {processing ? 'Processando...' : 'Processar Arquivos'}
                                </Button>
                            </Card.Footer>
                        </Card>
                    )}

                    {processing && (
                        <Card className="mb-4">
                            <Card.Body>
                                <div className="text-center py-3">
                                    <p className="mb-2"><strong>Processando arquivos...</strong></p>
                                    <ProgressBar animated now={100} variant="primary" />
                                    <small className="text-muted mt-2 d-block">Isso pode levar alguns segundos</small>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {results.length > 0 && (
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white">
                                <strong>Resultados do Processamento</strong>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {results.map((result, index) => (
                                    <ListGroup.Item key={index}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center mb-3">
                                                    {result.success ? (
                                                        <CheckCircleFill className="text-success me-2" size={24} />
                                                    ) : (
                                                        <XCircleFill className="text-danger me-2" size={24} />
                                                    )}
                                                    <div>
                                                        <strong className="d-block">{result.fileName}</strong>
                                                        {result.error && (
                                                            <small className="text-danger">{result.error}</small>
                                                        )}
                                                    </div>
                                                </div>

                                                {result.success && (
                                                    <>
                                                        <Row className="mb-3 g-3">
                                                            <Col xs={6} md={3}>
                                                                <Card className="border-0 bg-light text-center p-2">
                                                                    <small className="text-muted">Total de Linhas</small>
                                                                    <strong className="h5 mb-0">{result.totalLinhas}</strong>
                                                                </Card>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <Card className="border-0 bg-success bg-opacity-10 text-center p-2">
                                                                    <small className="text-muted">Encontrados</small>
                                                                    <strong className="h5 mb-0 text-success">{result.produtosEncontrados}</strong>
                                                                </Card>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <Card className="border-0 bg-danger bg-opacity-10 text-center p-2">
                                                                    <small className="text-muted">Não Encontrados</small>
                                                                    <strong className="h5 mb-0 text-danger">{result.produtosNaoEncontrados}</strong>
                                                                </Card>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <Card className="border-0 bg-primary bg-opacity-10 text-center p-2">
                                                                    <small className="text-muted">Valor Total</small>
                                                                    <strong className="h5 mb-0 text-primary">R$ {result.valorTotal.toFixed(2)}</strong>
                                                                </Card>
                                                            </Col>
                                                        </Row>

                                                        {result.warnings.length > 0 && (
                                                            <Alert variant="warning" className="py-2 mb-0">
                                                                <div className="d-flex align-items-start">
                                                                    <ExclamationTriangleFill className="me-2 mt-1 flex-shrink-0" />
                                                                    <div className="flex-grow-1">
                                                                        <strong>{result.warnings.length} aviso(s):</strong>
                                                                        <ul className="mb-0 mt-1 ps-3 small">
                                                                            {result.warnings.slice(0, 3).map((w, i) => (
                                                                                <li key={i}>{w}</li>
                                                                            ))}
                                                                            {result.warnings.length > 3 && (
                                                                                <li className="text-muted">... e mais {result.warnings.length - 3} aviso(s)</li>
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </Alert>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {result.success && (
                                                <div className="d-flex flex-column gap-2 ms-3">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handlePreview(result)}
                                                    >
                                                        <EyeFill className="me-1" />
                                                        Visualizar
                                                    </Button>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleImportSales(result)}
                                                        disabled={!result.canImport}
                                                    >
                                                        <CheckCircleFill className="me-1" />
                                                        Importar
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    )}
                </Col>

                <Col lg={4}>
                    <Card className="mb-3 shadow-sm border-primary">
                        <Card.Body>
                            <div className="d-flex align-items-start mb-3">
                                <InfoCircleFill size={24} className="text-primary me-2 mt-1" />
                                <div>
                                    <Card.Title className="h6 mb-0">Como funciona?</Card.Title>
                                </div>
                            </div>
                            <ol className="small ps-3 mb-0">
                                <li className="mb-2">Prepare sua planilha com colunas como: <strong>SKU</strong>, <strong>Produto</strong>, <strong>Quantidade</strong>, <strong>Preço</strong></li>
                                <li className="mb-2">Faça o upload do arquivo (CSV ou Excel)</li>
                                <li className="mb-2">O sistema identifica automaticamente os produtos</li>
                                <li className="mb-2">Revise os resultados na pré-visualização</li>
                                <li>Importe as vendas e o estoque é atualizado automaticamente</li>
                            </ol>
                        </Card.Body>
                    </Card>

                    <Card className="mb-3 shadow-sm bg-light">
                        <Card.Body>
                            <Card.Title className="h6">
                                💡 Dicas Importantes
                            </Card.Title>
                            <ul className="small mb-0 ps-3">
                                <li className="mb-2">Use o <strong>SKU</strong> para garantir maior precisão</li>
                                <li className="mb-2">Se o preço não for informado, usamos o preço médio do estoque</li>
                                <li className="mb-2">Produtos não encontrados aparecem nos avisos</li>
                                <li className="mb-2">Vendas são agrupadas automaticamente por data e cliente</li>
                                <li>O estoque é baixado usando o método FIFO (primeiro a vencer, primeiro a sair)</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm bg-info bg-opacity-10 border-info">
                        <Card.Body>
                            <Card.Title className="h6 text-info">
                                📋 Colunas Reconhecidas
                            </Card.Title>
                            <div className="small">
                                <div className="mb-2">
                                    <Badge bg="info" className="me-2">SKU</Badge>
                                    <small>codigo, cod, ref, referencia</small>
                                </div>
                                <div className="mb-2">
                                    <Badge bg="info" className="me-2">Produto</Badge>
                                    <small>nome, descricao, item</small>
                                </div>
                                <div className="mb-2">
                                    <Badge bg="info" className="me-2">Quantidade</Badge>
                                    <small>qtde, qtd, unidade, qty</small>
                                </div>
                                <div className="mb-2">
                                    <Badge bg="info" className="me-2">Preço</Badge>
                                    <small>valor, price, vl</small>
                                </div>
                                <div className="mb-2">
                                    <Badge bg="info" className="me-2">Data</Badge>
                                    <small>date, dia</small>
                                </div>
                                <div>
                                    <Badge bg="info" className="me-2">Cliente</Badge>
                                    <small>comprador, customer</small>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FileEarmarkSpreadsheet className="me-2" />
                        Pré-visualização: {previewData?.fileName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {previewData && (
                        <>
                            <Alert variant="info" className="mb-3">
                                <strong>Colunas identificadas automaticamente:</strong>
                                <Row className="mt-2 g-2">
                                    {Object.entries(previewData.columnMap).map(([key, value]) => (
                                        value && (
                                            <Col xs={6} md={4} key={key}>
                                                <Badge bg="info" className="me-1">{key}:</Badge>
                                                <small>{value}</small>
                                            </Col>
                                        )
                                    ))}
                                </Row>
                            </Alert>

                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <Table striped bordered hover size="sm">
                                    <thead className="sticky-top bg-white">
                                        <tr>
                                            <th style={{ width: '60px' }}>Linha</th>
                                            <th style={{ width: '60px' }}>Status</th>
                                            <th style={{ width: '100px' }}>SKU</th>
                                            <th>Produto</th>
                                            <th style={{ width: '80px' }}>Qtd</th>
                                            <th style={{ width: '100px' }}>Preço Un.</th>
                                            <th style={{ width: '100px' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.rows.map((row, index) => (
                                            <tr key={index} className={!row.found ? 'table-danger' : (!row.hasStock ? 'table-warning' : '')}>
                                                <td className="text-center">{row.linha}</td>
                                                <td className="text-center">
                                                    {row.found && row.hasStock && (
                                                        <CheckCircleFill className="text-success" title="OK" />
                                                    )}
                                                    {row.found && !row.hasStock && (
                                                        <ExclamationTriangleFill className="text-warning" title="Estoque insuficiente" />
                                                    )}
                                                    {!row.found && (
                                                        <XCircleFill className="text-danger" title="Produto não encontrado" />
                                                    )}
                                                </td>
                                                <td><small className="font-monospace">{row.sku}</small></td>
                                                <td><small>{row.nome}</small></td>
                                                <td className="text-center">{row.quantidade}</td>
                                                <td className="text-end">R$ {row.precoUnitario.toFixed(2)}</td>
                                                <td className="text-end"><strong>R$ {row.subtotal.toFixed(2)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <th colSpan="6" className="text-end">Total:</th>
                                            <th className="text-end">R$ {previewData.valorTotal.toFixed(2)}</th>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>

                            <div className="mt-3">
                                <Alert variant="secondary" className="mb-0 d-flex align-items-center">
                                    <InfoCircleFill className="me-2 flex-shrink-0" />
                                    <div className="small">
                                        <strong>Legenda:</strong>
                                        <span className="ms-3">
                                            <CheckCircleFill className="text-success me-1" /> Produto OK
                                        </span>
                                        <span className="ms-3">
                                            <ExclamationTriangleFill className="text-warning me-1" /> Estoque baixo
                                        </span>
                                        <span className="ms-3">
                                            <XCircleFill className="text-danger me-1" /> Não encontrado
                                        </span>
                                    </div>
                                </Alert>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between w-100 align-items-center">
                        <div className="text-muted small">
                            {previewData?.canImport ? (
                                <span className="text-success">
                                    <CheckCircleFill className="me-1" />
                                    Pronto para importar {previewData.rows.filter(r => r.found && r.hasStock).length} produto(s)
                                </span>
                            ) : (
                                <span className="text-danger">
                                    <XCircleFill className="me-1" />
                                    Nenhum produto válido para importar
                                </span>
                            )}
                        </div>
                        <div>
                            <Button variant="secondary" onClick={() => setShowPreview(false)}>
                                Fechar
                            </Button>
                            {previewData?.canImport && (
                                <Button 
                                    variant="success" 
                                    className="ms-2"
                                    onClick={() => {
                                        handleImportSales(previewData);
                                        setShowPreview(false);
                                    }}
                                >
                                    <CheckCircleFill className="me-2" />
                                    Importar Vendas
                                </Button>
                            )}
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UploadPOS;