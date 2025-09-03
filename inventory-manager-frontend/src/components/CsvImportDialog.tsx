import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CsvService } from '../services/api';

enum ImportStep {
  UPLOAD = 0,
  PREVIEW = 1,
  IMPORT = 2,
  COMPLETE = 3
}

const steps = [
  'Upload CSV',
  'Preview',
  'Import',
  'Complete'
];

interface CsvRow {
  name: string;
  quantity_inventory: number;
  quantity_sold: number;
  format: string;
  tags: string;
  deprecated: boolean;
}

interface CsvImportResult {
  imported: number;
  errors: number;
  messages: string[];
}

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const CsvImportDialog: React.FC<CsvImportDialogProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState<ImportStep>(ImportStep.UPLOAD);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvText, setCsvText] = useState<string>('');
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const queryClient = useQueryClient();

  // Parse CSV text
  const parseCsv = (text: string): CsvRow[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['Name', '#', '# SOLD', 'Format', 'Tags', 'Deprecated'];

    if (headers.length !== expectedHeaders.length) {
      throw new Error('CSV must have exactly 6 columns: Name, #, # SOLD, Format, Tags, Deprecated');
    }

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim());
      if (cols.length !== 6) {
        throw new Error(`Row ${i + 1} has ${cols.length} columns, expected 6`);
      }

      rows.push({
        name: cols[0],
        quantity_inventory: parseInt(cols[1]) || 0,
        quantity_sold: parseInt(cols[2]) || 0,
        format: cols[3],
        tags: cols[4],
        deprecated: cols[5].toLowerCase() === 'yes' || cols[5].toLowerCase() === 'true'
      });
    }

    return rows;
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setCsvText(text);
        const data = parseCsv(text);
        setCsvData(data);
        setActiveStep(ImportStep.PREVIEW);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Import CSV mutation
  const importCsvMutation = useMutation({
    mutationFn: (data: CsvRow[]) => CsvService.importCsv(data),
    onSuccess: (result) => {
      setImportResult(result);
      setActiveStep(ImportStep.COMPLETE);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to import CSV data.');
    }
  });

  const handleClose = () => {
    setActiveStep(ImportStep.UPLOAD);
    setCsvData([]);
    setCsvText('');
    setImportResult(null);
    setError('');
    onClose();
  };

  const handlePreview = () => {
    if (!csvText.trim()) {
      setError('Please upload a CSV file first');
      return;
    }
    try {
      const data = parseCsv(csvText);
      setCsvData(data);
      setActiveStep(ImportStep.PREVIEW);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImport = () => {
    setActiveStep(ImportStep.IMPORT);
    importCsvMutation.mutate(csvData);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case ImportStep.UPLOAD:
        return (
          <Box sx={{ p: 2, minHeight: 200 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Upload a CSV file containing your products and inventory data.
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              Expected CSV format: Name, #, # SOLD, Format, Tags, Deprecated
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                The CSV should have the following columns:
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><strong>Name:</strong> Product name</li>
                  <li><strong>#:</strong> Current inventory quantity</li>
                  <li><strong># SOLD:</strong> Number of items sold (will create sale records)</li>
                  <li><strong>Format & Tags:</strong> Added as separate tags</li>
                  <li><strong>Deprecated:</strong> 'Yes'/'True'/'No'/'False'</li>
                </ul>
                Note: Price will be set to $0 for imported products and can be updated later.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Choose CSV File
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        );

      case ImportStep.PREVIEW:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Preview CSV Data ({csvData.length} products found)
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Product Name</strong></TableCell>
                    <TableCell><strong>Inventory</strong></TableCell>
                    <TableCell><strong>Sold</strong></TableCell>
                    <TableCell><strong>Tags</strong></TableCell>
                    <TableCell><strong>Deprecated</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.quantity_inventory}</TableCell>
                      <TableCell>{row.quantity_sold}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip key={`format-${index}`} label={row.format} size="small" variant="outlined" />
                          <Chip key={`tags-${index}`} label={row.tags} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.deprecated ? 'Yes' : 'No'}
                          color={row.deprecated ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case ImportStep.IMPORT:
        return (
          <Box sx={{ p: 2, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Importing CSV Data...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creating products, inventories, and sales records.
              </Typography>
            </Box>
          </Box>
        );

      case ImportStep.COMPLETE:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
              Import Complete!
            </Typography>

            {importResult && (
              <Box sx={{ mb: 2 }}>
                <Alert severity={importResult.errors > 0 ? 'warning' : 'success'}>
                  <Typography variant="body2">
                    <strong>Summary:</strong><br />
                    • {importResult.imported} products successfully imported<br />
                    {importResult.errors > 0 && `• ${importResult.errors} errors occurred`}
                  </Typography>
                </Alert>

                {importResult.messages && importResult.messages.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Messages:</strong>
                    </Typography>
                    {importResult.messages.map((msg, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        • {msg}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="body2">
              The CSV data has been imported into your inventory system. You can now view your products and update prices as needed.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    switch (activeStep) {
      case ImportStep.UPLOAD:
        return 'Upload File';
      case ImportStep.PREVIEW:
        return 'Import Products';
      case ImportStep.COMPLETE:
        return 'Close';
      default:
        return 'Next';
    }
  };

  const getNextButtonDisabled = () => {
    if (activeStep === ImportStep.UPLOAD) {
      return !csvText.trim() && csvData.length === 0;
    }
    if (activeStep === ImportStep.PREVIEW) {
      return csvData.length === 0 || importCsvMutation.isPending;
    }
    return false;
  };

  const handleNext = () => {
    switch (activeStep) {
      case ImportStep.UPLOAD:
        handlePreview();
        break;
      case ImportStep.PREVIEW:
        handleImport();
        break;
      case ImportStep.COMPLETE:
        handleClose();
        break;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '600px' } }}
    >
      <DialogTitle>
        Import Products from CSV
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ width: '100%', mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={activeStep >= ImportStep.IMPORT}>
          Cancel
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={getNextButtonDisabled()}
        >
          {getNextButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CsvImportDialog;