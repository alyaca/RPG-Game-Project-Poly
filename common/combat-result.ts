export interface CombatResult {
    total: number;
    diceValue: number;
}

export interface CombatResultDetails {
    attackValues: CombatResult;
    defenseValues: CombatResult;
}
