// SPDX-License-Identifier: Apache-2.0

const loadingIndicator = ['|', '/', '-', '\\'];
let currentIndex = 0;

export function updateLoadingIndicator(text: string) {
  process.stdout.write(`\r${loadingIndicator[currentIndex]} ${text}`);
  currentIndex = (currentIndex + 1) % loadingIndicator.length;
}
