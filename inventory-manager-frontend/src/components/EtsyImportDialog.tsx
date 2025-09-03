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
  Link
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { EtsyService } from '../services/api';

enum ImportStep {
  SELECT_DATE_RANGE = 0,
  FETCH_DATA = 1,
  PREVIEW_DATA = 2,
  IMPORT = 3,
  COMPLETE = 4
}

const steps = [
  'Select Date Range',
  'Fetch Data',
  'Preview & Import',
  'Complete'
];

interface EtsyImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const EtsyImportDialog: React.FC<EtsyImportDialogProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState<ImportStep>(ImportStep.SELECT_DATE_RANGE);
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [etsyData, setEtsyData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Fetch sales data mutation
  const fetchSalesMutation = useMutation({
    mutationFn: () => EtsyService.getSales(startDate, endDate),
    onSuccess: (data) => {
      // For now, using mock data since we don't have real Etsy authentication
      setEtsyData([
        {
          title: 'Sample Etsy Product 1',
          quantity: 2,
          price: 25.00,
          totalAmount: 50.00,
          created_timestamp: new Date().getTime() / 1000,
          receipt_id: 'receipt_123',
          tags: ['tag1', 'tag2']
        },
        {
          title: 'Sample Etsy Product 2',
          quantity: 1,
          price: 35.00,
          totalAmount: 35.00,
          created_timestamp: new Date().getTime() / 1000 - 86400, // Yesterday
          receipt_id: 'receipt_124',
          tags: ['tag3']
        }
      ]);
      setActiveStep(ImportStep.PREVIEW_DATA);
      setError('');
    },
    onError: (error: any) => {
      setError('Failed to fetch ETL sales data. Please check your Etsy authentication.\n' +
               'Note: Full Etsy integration requires API keys and OAuth setup.');
      console.error('Error fetching Etsy sales:', error);
    }
  });

  // Import sales mutation
  const importSalesMutation = useMutation({
    mutationFn: () => EtsyService.importSales(etsyData),
    onSuccess: (result) => {
      setImportResult(result);
      setActiveStep(ImportStep.COMPLETE);
      setError('');
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to import sales data.');
    }
  });

  const handleClose = () => {
    setActiveStep(ImportStep.SELECT_DATE_RANGE);
    setEtsyData([]);
    setImportResult(null);
    setError('');
    onClose();
  };

  const handleFetchData = () => {
    setActiveStep(ImportStep.FETCH_DATA);
    fetchSalesMutation.mutate();
  };

  const handleImport = () => {
    setActiveStep(ImportStep.IMPORT);
    importSalesMutation.mutate();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case ImportStep.SELECT_DATE_RANGE:
        return (
          <Box sx={{ p: 2, minHeight: 200 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Select a date range to fetch sales data from your Etsy shop.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> This feature requires Etsy API setup including API keys and OAuth authentication.
                For demo purposes, this will show sample data.
                <Link href="https://www.etsy.com/developers/documentation" target="_blank" sx={{ ml: 1 }}>
                  Learn about Etsy API
                </Link>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        );

      case ImportStep.FETCH_DATA:
        return (
          <Box sx={{ p: 2, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Fetching Etsy Sales Data...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we retrieve your sales data from Etsy.
              </Typography>
            </Box>
          </Box>
        );

      case ImportStep.PREVIEW_DATA:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Preview Sales Data ({etsyData.length} sales found)
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Product</strong></TableCell>
                    <TableCell><strong>Quantity</strong></TableCell>
                    <TableCell><strong>Price</strong></TableCell>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell><strong>Tags</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {etsyData.map((sale, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{sale.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receipt #{sale.receipt_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>${sale.price.toFixed(2)}</TableCell>
                      <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {sale.tags?.map((tag: string) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {etsyData.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No sales data found for the selected date range.
              </Typography>
            )}
          </Box>
        );

      case ImportStep.IMPORT:
        return (
          <Box sx={{ p: 2, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Importing Sales Data...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creating sales records in your inventory system.
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
                  <strong>Summary:</strong><br />
                  • {importResult.imported} sales successfully imported<br />
                  {importResult.errors > 0 && `• ${importResult.errors} errors occurred`}
                </Alert>
              </Box>
            )}

            <Typography variant="body2">
              The sales data has been imported into your inventory system. You can now see these sales in your reports and analytics.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    switch (activeStep) {
      case ImportStep.SELECT_DATE_RANGE:
        return 'Fetch Sales Data';
      case ImportStep.PREVIEW_DATA:
        return 'Import Sales';
      case ImportStep.COMPLETE:
        return 'Close';
      default:
        return 'Next';
    }
  };

  const getNextButtonDisabled = () => {
    if (activeStep === ImportStep.SELECT_DATE_RANGE) {
      return !startDate || !endDate || fetchSalesMutation.isPending;
    }
    if (activeStep === ImportStep.PREVIEW_DATA) {
      return etsyData.length === 0 || importSalesMutation.isPending;
    }
    return false;
  };

  const handleNext = () => {
    switch (activeStep) {
      case ImportStep.SELECT_DATE_RANGE:
        handleFetchData();
        break;
      case ImportStep.PREVIEW_DATA:
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
        Import Etsy Sales Data
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

export default EtsyImportDialog;