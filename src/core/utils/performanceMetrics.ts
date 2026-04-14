import { Player } from '../entities/player';

/**
 * Calcula a idade a partir de uma data de nascimento string (YYYY-MM-DD)
 */
export function calculateAge(birthDate?: string): number {
  if (!birthDate) return 30; // Idade padrão se não informada
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calcula o IMC (Índice de Massa Corporal)
 */
export function calculateBMI(weight?: number, height?: number): number {
  if (!weight || !height || height <= 0) return 24; // IMC médio se dados incompletos
  return weight / (height * height);
}

/**
 * Calcula o multiplicador físico baseado no biotipo e idade.
 * O objetivo é ajustar o rating técnico para o "rating efetivo" de jogo.
 */
export function getPhysicalMultiplier(player: Player): number {
  let multiplier = 1.0;

  const age = calculateAge(player.birth_date);
  const bmi = calculateBMI(player.weight, player.height);

  // 1. Ajuste por Idade
  // Veteranos (>42 anos) perdem um pouco de explosão física
  if (age > 42) {
    const ageDiff = age - 42;
    multiplier -= Math.min(0.2, ageDiff * 0.015);
  }

  // 2. Ajuste por IMC (Biotipo)
  if (bmi > 28) {
    // Sobrepeso reduz mobilidade
    const bmiDiff = bmi - 28;
    multiplier -= Math.min(0.25, bmiDiff * 0.02);
  } else if (bmi >= 21 && bmi <= 25) {
    // Biotipo atlético recebe bônus de agilidade
    multiplier += 0.05;
  }

  // 3. Casos Especiais (Goleiros)
  // Goleiros são menos afetados pelo peso para fins de sorting técnico, 
  // mas aqui estamos sendo genéricos no momento.
  
  return parseFloat(multiplier.toFixed(2));
}

/**
 * Retorna o rating efetivo (técnico * físico)
 */
export function getEffectiveRating(player: Player): number {
  const multiplier = getPhysicalMultiplier(player);
  return parseFloat((player.rating * multiplier).toFixed(2));
}
