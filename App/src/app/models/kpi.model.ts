export interface KPIs {
  ERP: {
    criticite_moyenne: number;
    cout_total: number;
    masse_totale: number;
    delai_moyen_fournisseur: number;
    temps_cao_total: number;
  };
  MES: {
    ecart_moyen_temps: number;
    taux_aleas: number;
    temps_arret_moyen: number;
    productivite_poste: number;
  };
  PLM: {
    cout_mo_total: number;
    score_competence: number;
    seniority_mix: {
      experts: number;
      juniors: number;
    };
  };
  CROSS: {
    impact_aleas: number;
    cout_retard: number;
  };
  WORKFLOW: {
    bottleneck_index: number;
    cycle_time_global: number;
    disponibilite_par_poste: { [poste: string]: number };
  };
}
