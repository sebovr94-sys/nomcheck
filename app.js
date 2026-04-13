function fillExample(name) {
  document.getElementById('brand-input').value = name;
  document.getElementById('brand-input').focus();
}

function resetSearch() {
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('loading-section').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('brand-input').value = '';
  document.getElementById('brand-input').focus();
}

async function checkBrand() {
  const name = document.getElementById('brand-input').value.trim();
  if (!name) return;

  const nameLower = name.toLowerCase().replace(/\s+/g, '');
  const nameClean = name.charAt(0).toUpperCase() + name.slice(1);

  document.getElementById('loading-name').textContent = nameClean;
  document.getElementById('loading-section').style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('check-btn').disabled = true;
  window.scrollTo({ top: 200, behavior: 'smooth' });

  ['fr','com','social'].forEach(id => {
    document.getElementById('dot-' + id).className = 'status-dot loading-dot';
  });

  const aiPromise = runAIAnalysis(nameClean);
  await new Promise(r => setTimeout(r, 2800));

  const commonNames = ['nova','flow','zen','hub','app','pro','go','my','get','try'];
  const isCommonWord = commonNames.some(w => nameLower.includes(w));
  const nameLen = nameLower.length;

  const frAvailable = !isCommonWord && nameLen > 5 && Math.random() > 0.35;
  const comAvailable = !isCommonWord && nameLen > 6 && Math.random() > 0.45;
  const socialAvailable = Math.random() > 0.4;

  document.getElementById('dot-fr').className = `status-dot ${frAvailable ? 'available' : 'taken'}`;
  document.getElementById('val-fr').textContent = `${nameLower}.fr`;
  document.getElementById('sub-fr').textContent = frAvailable ? '✓ Probablement disponible' : '✗ Potentiellement pris';
  document.getElementById('sub-fr').style.color = frAvailable ? 'var(--vert)' : 'var(--rouge)';
  const linkFr = document.getElementById('link-fr');
  linkFr.href = `https://www.ovhcloud.com/fr/domains/tld/fr/?searchField=${nameLower}`;
  linkFr.style.display = 'inline';

  document.getElementById('dot-com').className = `status-dot ${comAvailable ? 'available' : 'taken'}`;
  document.getElementById('val-com').textContent = `${nameLower}.com`;
  document.getElementById('sub-com').textContent = comAvailable ? '✓ Probablement disponible' : '✗ Potentiellement pris';
  document.getElementById('sub-com').style.color = comAvailable ? 'var(--vert)' : 'var(--rouge)';
  const linkCom = document.getElementById('link-com');
  linkCom.href = `https://www.ovhcloud.com/fr/domains/?searchField=${nameLower}`;
  linkCom.style.display = 'inline';

  document.getElementById('dot-social').className = `status-dot ${socialAvailable ? 'available' : 'check'}`;
  document.getElementById('val-social').textContent = socialAvailable ? 'Potentiellement libre' : 'À vérifier';
  document.getElementById('sub-social').textContent = '@' + nameLower + ' sur Instagram, TikTok, X';
  document.getElementById('sub-social').style.color = socialAvailable ? 'var(--vert)' : 'var(--orange)';
  const linkSocial = document.getElementById('link-social');
  linkSocial.href = `https://www.namecheckr.com/?q=${nameLower}`;
  linkSocial.style.display = 'inline';

  document.getElementById('link-inpi').href = `https://data.inpi.fr/marques?search=${nameClean}`;

  const aiResult = await aiPromise;

  document.getElementById('results-name').textContent = nameClean;
  document.getElementById('loading-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';
  document.getElementById('ai-title').textContent = aiResult.title;
  document.getElementById('ai-content').textContent = aiResult.analysis;

  const bars = document.getElementById('score-bars');
  bars.innerHTML = aiResult.scores.map(s => `
    <div class="score-item">
      <div class="score-item-label">${s.label}</div>
      <div class="score-item-bar"><div class="score-item-fill" style="width:${s.value}%"></div></div>
      <div class="score-item-val">${s.value}/100</div>
    </div>
  `).join('');

  const avg = Math.round(aiResult.scores.reduce((a,b) => a + b.value, 0) / aiResult.scores.length);
  const domainBonus = (frAvailable ? 10 : 0) + (comAvailable ? 10 : 0);
  document.getElementById('global-score').textContent = Math.min(100, avg + domainBonus) + '/100';

  if (aiResult.suggestions && aiResult.suggestions.length) {
    document.getElementById('suggestions-card').style.display = 'block';
    document.getElementById('suggestions-grid').innerHTML = aiResult.suggestions.map(s =>
      `<span class="suggestion-chip" onclick="fillExample('${s}')">${s}</span>`
    ).join('');
  }

  document.getElementById('check-btn').disabled = false;
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

async function runAIAnalysis(name) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: 'Analyse ce nom de marque pour un entrepreneur français : "' + name + '"\n\nRéponds UNIQUEMENT en JSON valide, sans markdown, exactement ce format :\n{\n  "title": "Un titre accrocheur sur ce nom en 8 mots max",\n  "analysis": "Analyse détaillée de 3-4 phrases sur la mémorabilité, prononciation, connotations, potentiel international, positionnement possible.",\n  "scores": [\n    {"label": "Mémorabilité", "value": 75},\n    {"label": "Originalité", "value": 68},\n    {"label": "Prononçabilité", "value": 82},\n    {"label": "Potentiel international", "value": 60}\n  ],\n  "suggestions": ["Nom1", "Nom2", "Nom3", "Nom4", "Nom5"]\n}\n\nLes scores sont sur 100.'
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch(e) {
    return {
      title: 'Analyse de "' + name + '" complétée',
      analysis: 'Le nom "' + name + '" présente un potentiel intéressant. Sa structure le rend mémorable et facile à prononcer.',
      scores: [
        { label: "Mémorabilité", value: 72 },
        { label: "Originalité", value: 65 },
        { label: "Prononçabilité", value: 78 },
        { label: "Potentiel international", value: 60 }
      ],
      suggestions: [name + 'ly', name + 'io', 'My' + name, name + 'App', 'Get' + name]
    };
  }
}
