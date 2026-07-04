import type { Cotisation, Mandataire } from '../types';
import { formatCurrency, formatDate, COTISATION_TYPE_LABELS, MODE_PAIEMENT_LABELS } from './format';

export function generateReceiptPDF(cotisation: Cotisation, mandataire: Mandataire | undefined): string {
  const receiptNumber = `REC-${cotisation.id.slice(0, 8).toUpperCase()}`;
  const date = formatDate(cotisation.date_paiement);
  const montant = formatCurrency(Number(cotisation.montant));
  const type = COTISATION_TYPE_LABELS[cotisation.type];
  const mode = MODE_PAIEMENT_LABELS[cotisation.mode_paiement];

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Reçu ${receiptNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; background: #f8fafc; }
  .receipt { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1f60f1, #1a3db4); color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { font-size: 22px; font-weight: 700; }
  .header p { font-size: 12px; opacity: 0.85; margin-top: 4px; }
  .logo { width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; border: 1px solid rgba(255,255,255,0.2); }
  .body { padding: 32px 40px; }
  .receipt-info { display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px dashed #e2e8f0; }
  .receipt-info div { text-align: left; }
  .receipt-info label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .receipt-info value { font-size: 16px; font-weight: 600; color: #0f172a; display: block; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .info-item label { font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px; }
  .info-item value { font-size: 14px; color: #1e293b; font-weight: 500; }
  .amount-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
  .amount-box label { font-size: 12px; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
  .amount-box .amount { font-size: 32px; font-weight: 700; color: #047857; margin-top: 8px; }
  .footer { padding: 24px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .signature { text-align: center; }
  .signature .line { width: 200px; border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 8px; font-size: 12px; color: #64748b; }
  .watermark { text-align: center; font-size: 10px; color: #cbd5e1; margin-top: 16px; }
</style>
</head>
<body>
  <div class="receipt">
      <div class="header">
      <div>
        <h1>SGMEP</h1>
        <p>Système de Gestion des Mandataires et Élus du Parti</p>
      </div>
      <div class="logo"><img src="/assets/burec-logo.svg" alt="BUREC" style="width:40px;height:40px;object-fit:cover;border-radius:10px;"/></div>
    </div>
    <div class="body">
      <div class="receipt-info">
        <div>
          <label>Reçu N°</label>
          <value>${receiptNumber}</value>
        </div>
        <div style="text-align:right;">
          <label>Date d'émission</label>
          <value>${date}</value>
        </div>
      </div>

      <div class="section">
        <h2>Informations du mandataire</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Matricule</label>
            <value>${mandataire?.matricule ?? cotisation.mandataire_id.slice(0, 8)}</value>
          </div>
          <div class="info-item">
            <label>Nom complet</label>
            <value>${mandataire ? `${mandataire.prenom} ${mandataire.nom} ${mandataire.postnom}` : '—'}</value>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Détails du paiement</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Type de cotisation</label>
            <value>${type}</value>
          </div>
          <div class="info-item">
            <label>Mode de paiement</label>
            <value>${mode}</value>
          </div>
          <div class="info-item">
            <label>Référence</label>
            <value>${cotisation.reference ?? '—'}</value>
          </div>
          <div class="info-item">
            <label>Date de paiement</label>
            <value>${date}</value>
          </div>
        </div>
      </div>

      <div class="amount-box">
        <label>Montant total</label>
        <div class="amount">${montant}</div>
      </div>

      ${cotisation.commentaire ? `<div class="section"><h2>Commentaire</h2><p style="font-size:14px;color:#475569;">${cotisation.commentaire}</p></div>` : ''}
    </div>
    <div class="footer">
      <div class="signature">
        <div class="line">Signature et cachet</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#94a3b8;">
        Document généré électroniquement<br/>
        par le système SGMEP
      </div>
    </div>
    <div class="watermark">© 2026 SGMEP - Reçu officiel de cotisation</div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

export function downloadReceipt(cotisation: Cotisation, mandataire: Mandataire | undefined) {
  const url = generateReceiptPDF(cotisation, mandataire);
  const win = window.open(url, '_blank');
  if (!win) {
    window.location.href = url;
  }
}

export function exportToCSV<T>(
  data: T[],
  columns: { key: string; label: string; format?: (row: T) => string }[],
  filename: string
) {
  const headers = columns.map((c) => c.label).join(';');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = c.format ? c.format(row) : String((row as Record<string, unknown>)[c.key] ?? '');
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(';')
  );
  const csv = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
