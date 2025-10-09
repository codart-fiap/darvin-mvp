import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getInventoryByRetailer, getClientsByRetailer, getActorsByType } from '../../../state/selectors';
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

    // Estados para o modal de vincular/criar produto
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [unidentifiedRows, setUnidentifiedRows] = useState([]);
    const [currentRowIndex, setCurrentRowIndex] = useState(0);
    const [linkAction, setLinkAction] = useState('link');
    const [selectedLinkProduct, setSelectedLinkProduct] = useState('');
    const [newProductData, setNewProductData] = useState({ 
        nome: '', 
        sku: '', 
        categoria: 'Geral', 
        precoVenda: 0, 
        industryId: '',
        custoMedio: 0,
        estoque: 0
    });

    const inventory = useMemo(() => {
        if (!user) return [];
        return getInventoryByRetailer(user.actorId);
    }, [user, lastUpdated]);

    const clients = useMemo(() => {
        if (!user) return [];
        return getClientsByRetailer(user.actorId);
    }, [user, lastUpdated]);
    
    const industries = useMemo(() => getActorsByType('industry'), []);

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

    const findProduct = useCallback((sku) => {
        if (!sku) return null;
        const normalizedSku = normalizeText(sku);
        return inventory.find(item => normalizeText(item.sku) === normalizedSku);
    }, [inventory]);

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

        if (!columnMap.sku) {
            return { error: "A coluna 'SKU' é obrigatória na planilha." };
        }

        return columnMap;
    }, []);

    const parseMoneyValue = (value) => {
        if (!value) return 0;
        const cleaned = value.toString().replace(/[^\d,.-]/g, '');
        const normalized = cleaned.replace(',', '.');
        return parseFloat(normalized) || 0;
    };
    
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

        if (columnMap.error) {
            return { fileName, success: false, error: columnMap.error };
        }

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

            if (!sku) {
                warnings.push(`Linha ${i + 2}: SKU não informado. Esta linha será ignorada.`);
                continue;
            }

            const product = findProduct(sku);

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
                    sku: sku,
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
            success: true,
            canImport: true, 
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
    
    const handleImportInitiation = (resultData) => {
        setPreviewData(resultData);
        const notFoundRows = resultData.rows.filter(r => !r.found);
        
        if (notFoundRows.length > 0) {
            setUnidentifiedRows(notFoundRows);
            setCurrentRowIndex(0);
            const firstRow = notFoundRows[0];
            setLinkAction('link');
            setSelectedLinkProduct('');
            setNewProductData({ 
                nome: firstRow.nome, 
                sku: firstRow.sku, 
                categoria: 'Geral', 
                precoVenda: firstRow.precoUnitario || 0,
                industryId: '',
                custoMedio: 0,
                estoque: firstRow.quantidade
            });
            setShowLinkModal(true);
        } else {
            handleFinalImport(resultData);
        }
    };

    const handleLinkProduct = () => {
        const product = inventory.find(p => p.productId === selectedLinkProduct);
        if (!product) {
            alert('Por favor, selecione um produto válido.');
            return;
        }

        const currentRow = unidentifiedRows[currentRowIndex];
        
        // Atualiza os results com o produto vinculado
        const updatedResults = results.map(res => {
            if (res.fileName === previewData.fileName) {
                const updatedRows = res.rows.map(row => {
                    if (row.linha === currentRow.linha) {
                        const preco = row.precoUnitario || product.avgPrice;
                        return {
                            ...row,
                            found: true,
                            productId: product.productId,
                            sku: product.sku,
                            nome: product.nome,
                            precoUnitario: preco,
                            subtotal: preco * row.quantidade,
                            hasStock: product.totalStock >= row.quantidade,
                        };
                    }
                    return row;
                });
                
                const validRows = updatedRows.filter(r => r.found && r.hasStock);
                const valorTotal = validRows.reduce((sum, r) => sum + r.subtotal, 0);
                
                return { 
                    ...res, 
                    rows: updatedRows,
                    produtosNaoEncontrados: res.produtosNaoEncontrados - 1,
                    produtosEncontrados: res.produtosEncontrados + 1,
                    valorTotal
                };
            }
            return res;
        });
        
        setResults(updatedResults);
        
        // Atualiza o previewData
        const updatedPreviewData = updatedResults.find(r => r.fileName === previewData.fileName);
        setPreviewData(updatedPreviewData);
        
        proceedToNextOrFinish();
    };
    
    const handleCreateProduct = () => {
        if (!newProductData.nome || !newProductData.sku) {
            alert('Nome e SKU são obrigatórios!');
            return;
        }

        const currentRow = unidentifiedRows[currentRowIndex];
        
        // Cria o novo produto
        const allProducts = getItem('products') || [];
        const allInventory = getItem('inventory') || [];
        const selectedIndustry = industries.find(i => i.id === newProductData.industryId);

        const newProductId = generateId();
        
        // Adiciona aos produtos
        const newProductEntry = {
            id: newProductId,
            sku: newProductData.sku,
            nome: newProductData.nome,
            categoria: newProductData.categoria,
            subcategoria: 'Geral',
            marca: selectedIndustry?.nomeFantasia || 'Marca Própria',
            industryId: newProductData.industryId || 'manual',
            precoSugerido: newProductData.precoVenda,
        };
        setItem('products', [...allProducts, newProductEntry]);

        // Adiciona ao inventário com o estoque inicial
        const newInventoryItem = {
            id: generateId(),
            retailerId: user.actorId,
            productId: newProductId,
            sku: newProductData.sku,
            nome: newProductData.nome,
            estoque: newProductData.estoque || 0,
            custoMedio: newProductData.custoMedio || 0,
            precoVenda: newProductData.precoVenda,
            dataValidade: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        };
        setItem('inventory', [...allInventory, newInventoryItem]);
        
        // Força atualização do inventário
        setLastUpdated(Date.now());

        // Atualiza os results
        const updatedResults = results.map(res => {
            if (res.fileName === previewData.fileName) {
                const updatedRows = res.rows.map(row => {
                    if (row.linha === currentRow.linha) {
                        const preco = newProductData.precoVenda;
                        return {
                            ...row,
                            found: true,
                            productId: newProductId,
                            sku: newProductData.sku,
                            nome: newProductData.nome,
                            precoUnitario: preco,
                            subtotal: preco * row.quantidade,
                            hasStock: newProductData.estoque >= row.quantidade,
                        };
                    }
                    return row;
                });
                
                const validRows = updatedRows.filter(r => r.found && r.hasStock);
                const valorTotal = validRows.reduce((sum, r) => sum + r.subtotal, 0);
                
                return { 
                    ...res, 
                    rows: updatedRows,
                    produtosNaoEncontrados: res.produtosNaoEncontrados - 1,
                    produtosEncontrados: res.produtosEncontrados + 1,
                    valorTotal
                };
            }
            return res;
        });
        
        setResults(updatedResults);
        
        // Atualiza o previewData
        const updatedPreviewData = updatedResults.find(r => r.fileName === previewData.fileName);
        setPreviewData(updatedPreviewData);
        
        proceedToNextOrFinish();
    };

    const proceedToNextOrFinish = () => {
        const nextIndex = currentRowIndex + 1;
        
        if (nextIndex < unidentifiedRows.length) {
            // Vai para o próximo produto não identificado
            setCurrentRowIndex(nextIndex);
            const nextRow = unidentifiedRows[nextIndex];
            setNewProductData({ 
                nome: nextRow.nome, 
                sku: nextRow.sku, 
                categoria: 'Geral', 
                precoVenda: nextRow.precoUnitario || 0,
                industryId: '',
                custoMedio: 0,
                estoque: nextRow.quantidade
            });
            setSelectedLinkProduct('');
            setLinkAction('link');
        } else {
            // Todos resolvidos, fecha o modal e importa
            setShowLinkModal(false);
            const finalResultData = results.find(r => r.fileName === previewData.fileName);
            handleFinalImport(finalResultData);
        }
    };

    const handleFinalImport = (resultData) => {
        const validRows = resultData.rows.filter(r => r.found && r.hasStock);

        if (validRows.length === 0) {
            alert('Nenhuma venda válida para importar. Verifique o estoque dos produtos.');
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
                dataISO: new Date(group.data).toISOString(),
                clienteId: group.cliente,
                itens: saleItems,
                totalBruto,
                desconto: 0,
                totalLiquido: totalBruto,
                formaPagamento: "Upload de Planilha",
                observacao: `Importado de ${resultData.fileName}`
            };

            allSales.push(newSale);

            // Baixa do estoque (FEFO)
            for (const item of saleItems) {
                let quantityToDeduct = item.qtde;
                const productBatches = currentInventory
                    .filter(inv => inv.productId === item.productId && inv.estoque > 0 && inv.retailerId === user.actorId)
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

        alert(`✅ ${salesImported} venda(s) importada(s) com sucesso!\n${validRows.length} item(ns) registrado(s).`);
        
        setFiles([]);
        setResults([]);
        setLastUpdated(Date.now());
    };

    const downloadTemplate = () => {
        const template = [
            ['SKU', 'Produto', 'Quantidade', 'Preço', 'Data', 'Cliente', 'Forma de Pagamento'],
            ['BEB0001', 'Refrigerante Boreal Cola 2L', '2', '10.50', '2025-10-08', 'João Silva', 'Dinheiro'],
            ['ALI0001', 'Biscoito DoceVida Chocolate', '5', '4.50', '2025-10-08', 'Consumidor Final', 'PIX'],
            ['PROD-XYZ', 'Produto Novo Exemplo', '3', '15.00', '2025-10-08', '', 'Cartão de Crédito']
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
                                                    {!result.success ? (
                                                        <XCircleFill className="text-danger me-2" size={24} />
                                                    ) : (
                                                        <CheckCircleFill className="text-success me-2" size={24} />
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
                                                                <Card className="border-0 bg-danger bg-opacity-10 text-center p-2">
                                                                    <small className="text-muted">Não Encontrados</small>
                                                                    <strong className="h5 mb-0 text-danger">{result.produtosNaoEncontrados}</strong>
                                                                </Card>
                                                            </Col>
                                                            <Col xs={6} md={3}>
                                                                <Card className="border-0 bg-primary bg-opacity-10 text-center p-2">
                                                                    <small className="text-muted">Valor Válido</small>
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
                                                        onClick={() => handleImportInitiation(result)}
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
                                <li className="mb-2"><strong>Obrigatório:</strong> Sua planilha precisa ter uma coluna para <strong>SKU</strong>.</li>
                                <li className="mb-2">Faça o upload do arquivo (CSV ou Excel).</li>
                                <li className="mb-2">O sistema identifica os produtos pelo SKU.</li>
                                <li className="mb-2">Se um SKU não for encontrado, você poderá vinculá-lo a um produto existente ou criar um novo produto no estoque.</li>
                                <li>Revise os resultados e importe as vendas. O estoque é atualizado automaticamente.</li>
                            </ol>
                        </Card.Body>
                    </Card>

                    <Card className="mb-3 shadow-sm bg-light">
                        <Card.Body>
                            <Card.Title className="h6">
                                💡 Dicas Importantes
                            </Card.Title>
                            <ul className="small mb-0 ps-3">
                                <li className="mb-2">Se o preço não for informado, usamos o preço médio do estoque.</li>
                                <li className="mb-2">Produtos novos criados começam com o estoque que você definir.</li>
                                <li className="mb-2">Vendas são agrupadas por data, cliente e forma de pagamento.</li>
                                <li>O estoque é baixado usando o método FEFO (primeiro a vencer, primeiro a sair).</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal de Pré-visualização */}
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
                                <strong>Colunas identificadas:</strong>
                                <Row className="mt-2 g-2 small">
                                    {Object.entries(previewData.columnMap).map(([key, value]) => (
                                        value && (
                                            <Col xs={6} md={4} key={key}>
                                                <Badge bg="info" className="me-1">{key.toUpperCase()}:</Badge>
                                                <span>{value}</span>
                                            </Col>
                                        )
                                    ))}
                                </Row>
                            </Alert>

                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <Table striped bordered hover size="sm">
                                    <thead className="sticky-top bg-white">
                                        <tr>
                                            <th>Linha</th>
                                            <th>Status</th>
                                            <th>SKU</th>
                                            <th>Produto</th>
                                            <th>Qtd</th>
                                            <th>Preço Un.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.rows.map((row, index) => (
                                            <tr key={index} className={!row.found ? 'table-danger' : (!row.hasStock ? 'table-warning' : '')}>
                                                <td className="text-center">{row.linha}</td>
                                                <td className="text-center">
                                                    {row.found && row.hasStock && <CheckCircleFill className="text-success" title="OK" />}
                                                    {row.found && !row.hasStock && <ExclamationTriangleFill className="text-warning" title="Estoque insuficiente" />}
                                                    {!row.found && <XCircleFill className="text-danger" title="Produto não encontrado" />}
                                                </td>
                                                <td><small className="font-monospace">{row.sku}</small></td>
                                                <td><small>{row.nome}</small></td>
                                                <td className="text-center">{row.quantidade}</td>
                                                <td className="text-end">R$ {row.precoUnitario.toFixed(2)}</td>
                                                <td className="text-end"><strong>R$ {row.subtotal.toFixed(2)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
            
            {/* Modal de Vincular/Criar Produto */}
            <Modal show={showLinkModal} onHide={() => {}} centered backdrop="static" size="lg">
                <Modal.Header className="bg-warning bg-opacity-10">
                    <Modal.Title>
                        <ExclamationTriangleFill className="text-warning me-2" />
                        Resolver Produto Não Identificado
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {unidentifiedRows[currentRowIndex] && (
                        <>
                            <Alert variant="warning" className="mb-3">
                                <strong>Produto não encontrado!</strong>
                                <div className="mt-2">
                                    <div><strong>Linha:</strong> {unidentifiedRows[currentRowIndex].linha}</div>
                                    <div><strong>SKU:</strong> {unidentifiedRows[currentRowIndex].sku}</div>
                                    <div><strong>Nome:</strong> {unidentifiedRows[currentRowIndex].nome}</div>
                                </div>
                            </Alert>
                            
                            <div className="mb-3 text-center">
                                <Badge bg="primary" className="px-3 py-2">
                                    Resolvendo {currentRowIndex + 1} de {unidentifiedRows.length}
                                </Badge>
                            </div>
                            
                            <Form.Group className="mb-4">
                                <div className="d-flex gap-3">
                                    <Form.Check 
                                        type="radio" 
                                        label="Vincular a produto existente" 
                                        name="linkAction" 
                                        checked={linkAction === 'link'} 
                                        onChange={() => setLinkAction('link')}
                                        id="radio-link"
                                    />
                                    <Form.Check 
                                        type="radio" 
                                        label="Cadastrar novo produto" 
                                        name="linkAction" 
                                        checked={linkAction === 'create'} 
                                        onChange={() => setLinkAction('create')}
                                        id="radio-create"
                                    />
                                </div>
                            </Form.Group>

                            {linkAction === 'link' && (
                                <Card className="border-primary">
                                    <Card.Body>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">Selecione o produto correto no seu estoque:</Form.Label>
                                            <Form.Select 
                                                value={selectedLinkProduct} 
                                                onChange={e => setSelectedLinkProduct(e.target.value)}
                                                size="lg"
                                            >
                                                <option value="">-- Selecione um produto --</option>
                                                {inventory.map(item => (
                                                    <option key={item.productId} value={item.productId}>
                                                        {item.nome} (SKU: {item.sku}) - Estoque: {item.totalStock}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                O produto selecionado será vinculado a este SKU para futuras importações.
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            )}

                            {linkAction === 'create' && (
                                <Card className="border-success">
                                    <Card.Body>
                                        <h6 className="mb-3 text-success">
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Cadastrar Novo Produto
                                        </h6>
                                        <Row>
                                            <Col md={8}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Nome do Produto *</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={newProductData.nome} 
                                                        onChange={e => setNewProductData({...newProductData, nome: e.target.value})}
                                                        placeholder="Ex: Refrigerante Coca-Cola 2L"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>SKU *</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={newProductData.sku} 
                                                        readOnly 
                                                        disabled
                                                        className="bg-light"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Form.Group className="mb-3">
                                            <Form.Label>Fabricante/Indústria</Form.Label>
                                            <Form.Select 
                                                value={newProductData.industryId} 
                                                onChange={e => setNewProductData({...newProductData, industryId: e.target.value})}
                                            >
                                                <option value="">Marca Própria</option>
                                                {industries.map(ind => (
                                                    <option key={ind.id} value={ind.id}>{ind.nomeFantasia}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        
                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Categoria</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={newProductData.categoria} 
                                                        onChange={e => setNewProductData({...newProductData, categoria: e.target.value})}
                                                        placeholder="Ex: Bebidas"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Preço de Venda *</Form.Label>
                                                    <Form.Control 
                                                        type="number" 
                                                        step="0.01"
                                                        value={newProductData.precoVenda} 
                                                        onChange={e => setNewProductData({...newProductData, precoVenda: parseFloat(e.target.value) || 0})}
                                                        placeholder="0.00"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Custo Médio</Form.Label>
                                                    <Form.Control 
                                                        type="number" 
                                                        step="0.01"
                                                        value={newProductData.custoMedio} 
                                                        onChange={e => setNewProductData({...newProductData, custoMedio: parseFloat(e.target.value) || 0})}
                                                        placeholder="0.00"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <Form.Group className="mb-3">
                                            <Form.Label>Estoque Inicial</Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                value={newProductData.estoque} 
                                                onChange={e => setNewProductData({...newProductData, estoque: parseInt(e.target.value) || 0})}
                                                placeholder="0"
                                            />
                                            <Form.Text className="text-muted">
                                                Defina a quantidade em estoque. Se for menor que a quantidade da venda, essa linha não será importada.
                                            </Form.Text>
                                        </Form.Group>
                                        
                                        <Alert variant="info" className="mb-0 small">
                                            <i className="bi bi-info-circle me-2"></i>
                                            O produto será criado no seu estoque e vinculado automaticamente a este SKU.
                                        </Alert>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                            if (window.confirm('Tem certeza que deseja cancelar? Todo o progresso será perdido.')) {
                                setShowLinkModal(false);
                                setUnidentifiedRows([]);
                                setCurrentRowIndex(0);
                            }
                        }}
                    >
                        Cancelar Importação
                    </Button>
                    
                    {linkAction === 'link' && (
                        <Button 
                            variant="primary" 
                            onClick={handleLinkProduct} 
                            disabled={!selectedLinkProduct}
                        >
                            <i className="bi bi-link-45deg me-2"></i>
                            Vincular e Continuar
                        </Button>
                    )}
                    
                    {linkAction === 'create' && (
                        <Button 
                            variant="success" 
                            onClick={handleCreateProduct} 
                            disabled={!newProductData.nome || !newProductData.sku || newProductData.precoVenda <= 0}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Criar e Continuar
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UploadPOS;                                               