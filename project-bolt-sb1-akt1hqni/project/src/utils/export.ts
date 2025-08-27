import { Intervention } from '../types';

export const exportDayToHTML = (interventions: Intervention[], userEmail: string) => {
  const today = new Date().toLocaleDateString('fr-FR');
  const todayForFilename = new Date().toISOString().split('T')[0];
  const totalInterventions = interventions.reduce((acc, curr) => ({
    regulation: acc.regulation + curr.regulation,
    incivility: acc.incivility + curr.incivility,
    help: acc.help + curr.help,
    information: acc.information + curr.information,
    link: acc.link + curr.link,
    bike_scooter: acc.bike_scooter + curr.bike_scooter,
    stroller: acc.stroller + curr.stroller,
    physical_aggression: acc.physical_aggression + curr.physical_aggression,
    verbal_aggression: acc.verbal_aggression + curr.verbal_aggression,
    other: acc.other + curr.other
  }), { 
    regulation: 0, 
    incivility: 0, 
    help: 0, 
    information: 0, 
    link: 0, 
    bike_scooter: 0, 
    stroller: 0, 
    physical_aggression: 0, 
    verbal_aggression: 0, 
    other: 0 
  });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Médiation - ${today}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { background: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .intervention { border: 1px solid #E5E7EB; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .line-A { border-left: 4px solid #EF4444; }
        .line-B { border-left: 4px solid #38BDF8; }
        .line-C { border-left: 4px solid #F9A8D4; }
        .line-Autres { border-left: 4px solid #10B981; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #E5E7EB; }
        th { background: #F9FAFB; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport de Médiation</h1>
        <p>Date: ${today} | Médiateur: ${userEmail}</p>
    </div>
    
    <div class="summary">
        <h2>Résumé de la journée</h2>
        <p><strong>Total des interventions:</strong> ${interventions.length}</p>
        <ul>
            ${totalInterventions.regulation > 0 ? `<li>Régulations: ${totalInterventions.regulation}</li>` : ''}
            ${totalInterventions.incivility > 0 ? `<li>Incivilités: ${totalInterventions.incivility}</li>` : ''}
            ${totalInterventions.help > 0 ? `<li>Aides: ${totalInterventions.help}</li>` : ''}
            ${totalInterventions.information > 0 ? `<li>Renseignements: ${totalInterventions.information}</li>` : ''}
            ${totalInterventions.link > 0 ? `<li>Liens: ${totalInterventions.link}</li>` : ''}
            ${totalInterventions.bike_scooter > 0 ? `<li>Vélo/Trottinette: ${totalInterventions.bike_scooter}</li>` : ''}
            ${totalInterventions.stroller > 0 ? `<li>Poussettes: ${totalInterventions.stroller}</li>` : ''}
            ${totalInterventions.physical_aggression > 0 ? `<li>Agressions physiques: ${totalInterventions.physical_aggression}</li>` : ''}
            ${totalInterventions.verbal_aggression > 0 ? `<li>Agressions verbales: ${totalInterventions.verbal_aggression}</li>` : ''}
            ${totalInterventions.other > 0 ? `<li>Autres: ${totalInterventions.other}</li>` : ''}
        </ul>
    </div>
    
    <h2>Détail des interventions</h2>
    ${interventions.map(intervention => `
        <div class="intervention line-${intervention.line}">
            <h3>Ligne ${intervention.line}${intervention.custom_line ? ` (${intervention.custom_line})` : ''} - ${intervention.time}</h3>
            <p><strong>Véhicule:</strong> ${intervention.vehicle_number} | <strong>Arrêt:</strong> ${intervention.stop}</p>
            <table>
                <tr><th>Type</th><th>Nombre</th></tr>
                ${intervention.regulation > 0 ? `<tr><td>Régulations</td><td>${intervention.regulation}</td></tr>` : ''}
                ${intervention.incivility > 0 ? `<tr><td>Incivilités</td><td>${intervention.incivility}</td></tr>` : ''}
                ${intervention.help > 0 ? `<tr><td>Aides</td><td>${intervention.help}</td></tr>` : ''}
                ${intervention.information > 0 ? `<tr><td>Renseignements</td><td>${intervention.information}</td></tr>` : ''}
                ${intervention.link > 0 ? `<tr><td>Liens</td><td>${intervention.link}</td></tr>` : ''}
                ${intervention.bike_scooter > 0 ? `<tr><td>Vélo/Trottinette</td><td>${intervention.bike_scooter}</td></tr>` : ''}
                ${intervention.stroller > 0 ? `<tr><td>Poussettes</td><td>${intervention.stroller}</td></tr>` : ''}
                ${intervention.physical_aggression > 0 ? `<tr><td>Agressions physiques</td><td>${intervention.physical_aggression}</td></tr>` : ''}
                ${intervention.verbal_aggression > 0 ? `<tr><td>Agressions verbales</td><td>${intervention.verbal_aggression}</td></tr>` : ''}
                ${intervention.other > 0 ? `<tr><td>Autres</td><td>${intervention.other}</td></tr>` : ''}
            </table>
        </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 30px; color: #6B7280;">
        <p>Rapport généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
    </div>
</body>
</html>
  `;

  // Ouvrir dans un nouvel onglet au lieu de télécharger directement
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  } else {
    // Fallback si popup bloqué
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-mediation-${todayForFilename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};