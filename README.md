# Capaciteitsplanning Tool

Een webapplicatie voor het plannen en beheren van capaciteit van teams en projecten. Deze tool is ontwikkeld als Proof of Concept om de haalbaarheid aan te tonen van een centrale capaciteitsplanning-oplossing.

## Functies

### Kernfunctionaliteiten
- **Maandoverzicht dashboard** met projectplanning per maand
- **Automatische conflictdetectie** bij overplanning
- **Projectdetailpagina** met medewerkerbeheer
- **Prognosebeheer** voor factureerbare dagen
- **Configuratie** van waarschuwingsdrempels
- **Rapportage en export** naar CSV

### 👥 Gebruikersrollen
- **Teammanager**: Volledige rechten voor planning en beheer
- **Projectmanager**: Leestoegang en beperkte aanpassingen

## Installatie en Gebruik

### Vereisten
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Geen installatie nodig - draait volledig in de browser

### Starten
1. Open `index.html` in een web browser
2. Login met een van de volgende accounts:
   - **Teammanager**: `teammanager` / `manager123`
   - **Projectmanager**: `projectmanager` / `project123`
   - **Admin**: `admin` / `admin123`

### Pagina's en Functionaliteit

#### 1. Loginpagina
- Eenvoudige authenticatie met gebruikersnaam en wachtwoord
- Automatische doorverwijzing naar het juiste dashboard op basis van rol

#### 2. Dashboard / Maandoverzicht
- **Totaaloverzicht** van alle projecten per maand
- **Kleurindicaties** voor conflicten:
  - Groen: Planning binnen beschikbare dagen
  - Oranje: Lichte overschrijding (configureerbaar)
  - Rood: Zware overschrijding (configureerbaar)
- **Directe bewerking** van ingeplande dagen (alleen teammanagers)
- **Klik op projectnaam** voor details

#### 3. Projectdetailpagina
- **Projectinformatie**: naam, factureerbaarheid, status, beschrijving
- **Medewerkerbeheer**: dagen per medewerker, opmerkingen toevoegen
- **Notitiefunctie** voor communicatie tussen teammanager en projectmanager

#### 4. Projectbeheer (alleen teammanagers)
- **Toevoegen** van nieuwe projecten
- **Bewerken** van projecteigenschappen
- **Activeren/deactiveren** van projecten
- **Factureerbaarheid** instellen per project

#### 5. Prognose & Factureerbaarheid (alleen teammanagers)
- **Maandelijkse prognoses** instellen voor factureerbare dagen
- **Automatische vergelijking** met huidige planning
- **Statusindicatoren** voor potentiële conflicten

#### 6. Configuratie (alleen teammanagers)
- **Drempelwaarden** instellen voor waarschuwingen
- **Oranje waarschuwing**: aantal dagen overschrijding
- **Rode waarschuwing**: aantal dagen overschrijding
- **Waarschuwingen** aan/uit zetten

#### 7. Rapportage & Export
- **Maandelijkse overzichten** van planning vs beschikbaarheid
- **CSV export** voor verdere analyse
- **Statusindicatoren** per maand

## Technische Details

### Architectuur
- **Client-side webapplicatie** - draait volledig in de browser
- **Geen backend** nodig voor deze PoC
- **LocalStorage** voor data persistentie

### Technologieën
- **HTML5** voor structuur
- **Bootstrap 5** voor responsive design
- **CSS3** voor styling en animaties
- **Vanilla JavaScript** voor logica en interactie

### Data Opslag
- **LocalStorage** in de browser
- **Automatisch opslaan** van alle wijzigingen
- **Sample data** bij eerste gebruik

## Gebruikstips

### Voor Teammanagers
1. **Begin met projectbeheer** om je projecten in te stellen
2. **Stel prognoses** in voor factureerbare dagen
3. **Plan dagen** per project per maand in het dashboard
4. **Monitor conflicten** via de kleurindicaties
5. **Gebruik projectdetails** voor medewerker-specifieke planning

### Voor Projectmanagers
1. **Raadpleeg het dashboard** voor actuele planning
2. **Bekijk projectdetails** voor jouw projecten
3. **Voeg opmerkingen toe** bij medewerkers
4. **Exporteer rapportages** voor management

### Configuratie
- **Stel drempelwaarden** in op basis van je teamcapaciteit
- **Oranje waarschuwing**: adviseren om te monitoren
- **Rode waarschuwing**: direct actie vereist

## Beperkingen (PoC)

Deze Proof of Purpose heeft de volgende beperkingen:
- **Geen multi-user** ondersteuning
- **Geen centrale database** - data is lokaal per browser
- **Geen echte beveiliging** - login is gesimuleerd
- **Niet schaalbaar** voor productiegebruik

## Toekomstige Ontwikkeling

Voor een productieversie zouden de volgende uitbreidingen nodig zijn:
- **Backend API** met centrale database
- **Multi-user** ondersteuning met echte authenticatie
- **Integratie** met HR- en projectmanagement systemen
- **Geavanceerde rapportage** en analytics
- **Mobile app** voor onderweg

## Support

Voor vragen of problemen met de applicatie:
1. Controleer de browser console op foutmeldingen
2. Vernieuw de pagina en probeer opnieuw
3. Clear browser localStorage als data corrupt is

---
*Versie 1.0 - Proof of Concept*