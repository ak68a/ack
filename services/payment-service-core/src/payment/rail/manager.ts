import type { PaymentExecutor } from "../executors/base"
import type { PaymentMethodInfo } from "../core/types"
import type { PaymentMethod } from "../core/methods"

export class PaymentRailManager {
  private rails: Map<string, PaymentExecutor>
  private metrics: Map<string, PaymentMethodInfo>

  constructor(rails: PaymentExecutor[]) {
    this.rails = new Map(
      rails.map(rail => [rail.getPaymentMethod(), rail])
    )
    this.metrics = new Map()
    this.initializeMetrics()
  }

  private initializeMetrics(): void {
    for (const [method, rail] of this.rails) {
      this.metrics.set(method, {
        method: method as PaymentMethod,
        networks: rail.getNetworks(),
        currencies: rail.getCurrencies(),
        fees: {
          percentage: 0.029, // This should come from the executor
          fixed: 0.30
        },
        settlementTime: 24 * 60 * 60 * 1000, // 24 hours in ms
        capabilities: {
          refunds: rail.getCapabilities().refunds,
          partialRefunds: rail.getCapabilities().partialRefunds,
          disputes: rail.getCapabilities().disputes,
          recurring: rail.getCapabilities().recurring
        }
      })
    }
  }

  getRail(network: string, currency: string): PaymentExecutor | undefined {
    return Array.from(this.rails.values())
      .find(rail => rail.canHandlePayment(network, currency))
  }

  getAvailableRails(): PaymentMethodInfo[] {
    return Array.from(this.metrics.values())
  }

  getRailMetrics(method: string): PaymentMethodInfo | undefined {
    return this.metrics.get(method)
  }

  async validatePaymentMethod(
    method: string,
    network: string,
    currency: string
  ): Promise<boolean> {
    const rail = this.rails.get(method)
    if (!rail) {
      return false
    }
    return rail.canHandlePayment(network, currency)
  }

  getSupportedNetworks(method: string): string[] {
    const rail = this.rails.get(method)
    return rail ? rail.getNetworks() : []
  }

  getSupportedCurrencies(method: string): string[] {
    const rail = this.rails.get(method)
    return rail ? rail.getCurrencies() : []
  }
}
