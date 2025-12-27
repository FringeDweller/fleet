import { and, eq } from 'drizzle-orm'
import { alertRules } from '../database/schema'
import { db } from '../utils/db'
import { notificationService } from './notification.service'

export const alertService = {
  async evaluateRules(organizationId: string, asset: any) {
    const rules = await db.query.alertRules.findMany({
      where: and(eq(alertRules.organizationId, organizationId), eq(alertRules.isActive, true))
    })

    for (const rule of rules) {
      if (this.checkCondition(rule.condition, asset)) {
        await this.triggerAlert(rule, asset)
      }
    }
  },

  checkCondition(condition: any, asset: any) {
    const { field, operator, value } = condition
    const assetValue = asset[field]

    if (assetValue === undefined || assetValue === null) return false

    const numericAssetValue = Number(assetValue)
    const numericValue = Number(value)

    switch (operator) {
      case '>':
        return numericAssetValue > numericValue
      case '<':
        return numericAssetValue < numericValue
      case '=':
        return numericAssetValue === numericValue
      default:
        return false
    }
  },

  async triggerAlert(rule: any, asset: any) {
    console.log(`Alert triggered: ${rule.name} for asset ${asset.assetNumber}`)

    // For now, send to all managers in organization or specific users if defined
    // For simplicity, we'll just send a general notification to the organization for now
    // In a real app, you would look up users based on rule.recipients
    
    await notificationService.createNotification({
      organizationId: rule.organizationId,
      title: `Alert: ${rule.name}`,
      message: `Asset ${asset.assetNumber} (${asset.make} ${asset.model}) met condition: ${rule.condition.field} ${rule.condition.operator} ${rule.condition.value}`,
      type: 'warning',
      eventType: 'alert_rule',
      link: `/assets/${asset.id}`
    })
  }
}
