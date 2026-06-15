const PLATFORM_COMMISSION_PERCENT = 10;

export const calculateCommission = (finalPrice) => {
  const commission = (finalPrice * PLATFORM_COMMISSION_PERCENT) / 100;
  const taskerAmount = finalPrice - commission;
  return { commission, taskerAmount };
};
