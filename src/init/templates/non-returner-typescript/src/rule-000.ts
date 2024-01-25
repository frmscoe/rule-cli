// SPDX-License-Identifier: Apache-2.0

import {
  type DatabaseManagerInstance,
  type LoggerService,
  type ManagerConfig,
} from '@frmscoe/frms-coe-lib';
import {
  type RuleConfig,
  type RuleRequest,
  type RuleResult,
} from '@frmscoe/frms-coe-lib/lib/interfaces';

// This function is imported by the rule executor
export async function handleTransaction(
  _req: RuleRequest, /* remove _(underscore) in the beginning of the variable */
  _determineOutcome: (
    value: number,
    ruleConfig: RuleConfig,
    ruleResult: RuleResult,
  ) => RuleResult,
  ruleRes: RuleResult,
  loggerService: LoggerService,
  ruleConfig: RuleConfig,
  databaseManager: DatabaseManagerInstance<ManagerConfig>,
): Promise<RuleResult> {
  // Guard statements to throw errors early

  // Check if the rule configuration provided rule bands
  // Every rule is expected to have rule band this will make the determing of outcome to be possible
  // These are positive rule outcome ranges
  if (!ruleConfig.config.bands || ruleConfig.config.bands.length <= 0)
    throw new Error('Invalid config provided - bands not provided');

  // Check if exit conditions are provided
  // Most cases rules have configuration that provide exit conditions
  // These are not error condition but are valid outcome of the rule
  if (!ruleConfig.config.exitConditions)
    throw new Error('Invalid config provided - exitConditions not provided');


  // Value to be evaluated
  // The is a value that is suppose to be evaluated
  // More logic is expected here
  let value = 0

  // Rule Logic starts
  //
  /* databaseManager object Provide arango interaction e.g */loggerService.log(databaseManager.isReadyCheck())
  //
  // Rule Logic ends

  value = 1
  // Determnine outcome function from rule executor
  return ruleRes

}
