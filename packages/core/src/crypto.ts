import CryptoJS from 'crypto-js'
import type { ProofData } from './types'

/**
 * Generate a cryptographic hash of proof data
 * @param proofData Proof data to hash
 * @returns SHA-256 hash as hex string
 */
export function hashProofData(proofData: ProofData): string {
  const dataString = JSON.stringify({
    timestamp: proofData.timestamp,
    location: {
      lat: Math.round(proofData.location.lat * 1000000) / 1000000, // 6 decimal places
      lng: Math.round(proofData.location.lng * 1000000) / 1000000
    },
    accuracy: proofData.accuracy,
    nfc: proofData.nfc
  })
  
  return CryptoJS.SHA256(dataString).toString()
}

/**
 * Generate a secure random nonce
 * @param length Length in bytes (default 16)
 * @returns Random nonce as hex string
 */
export function generateNonce(length: number = 16): string {
  return CryptoJS.lib.WordArray.random(length).toString()
}

/**
 * Create a deterministic ID from multiple inputs
 * @param inputs Array of strings to combine
 * @returns SHA-256 hash as hex string
 */
export function createDeterministicId(...inputs: string[]): string {
  const combined = inputs.join('|')
  return CryptoJS.SHA256(combined).toString()
}

/**
 * Verify proof data integrity
 * @param proofData Proof data
 * @param expectedHash Expected hash
 * @returns Whether the proof data matches the hash
 */
export function verifyProofIntegrity(proofData: ProofData, expectedHash: string): boolean {
  const calculatedHash = hashProofData(proofData)
  return calculatedHash === expectedHash
}

/**
 * Generate a challenge-response for NFC verification
 * @param tagId NFC tag ID
 * @param timestamp Current timestamp
 * @param secret Shared secret (would be derived from tag)
 * @returns Challenge string
 */
export function generateNFCChallenge(tagId: string, timestamp: number, secret: string): string {
  const challenge = `${tagId}:${timestamp}:${generateNonce()}`
  const signature = CryptoJS.HmacSHA256(challenge, secret).toString()
  return `${challenge}:${signature}`
}

/**
 * Verify NFC challenge response
 * @param challenge Challenge string
 * @param secret Shared secret
 * @returns Whether the challenge is valid
 */
export function verifyNFCChallenge(challenge: string, secret: string): boolean {
  const parts = challenge.split(':')
  if (parts.length !== 4) return false
  
  const [tagId, timestamp, nonce, signature] = parts
  const expectedChallenge = `${tagId}:${timestamp}:${nonce}`
  const expectedSignature = CryptoJS.HmacSHA256(expectedChallenge, secret).toString()
  
  return signature === expectedSignature
}

/**
 * Create a merkle tree root from an array of hashes
 * @param hashes Array of hash strings
 * @returns Merkle root hash
 */
export function createMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return ''
  if (hashes.length === 1) return hashes[0]
  
  let currentLevel = hashes.slice()
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = []
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left
      const combined = CryptoJS.SHA256(left + right).toString()
      nextLevel.push(combined)
    }
    
    currentLevel = nextLevel
  }
  
  return currentLevel[0]
}

/**
 * Generate a proof-of-work style hash with difficulty
 * @param data Data to hash
 * @param difficulty Number of leading zeros required
 * @returns Object with hash and nonce
 */
export function generateProofOfWork(data: string, difficulty: number): { hash: string; nonce: number } {
  const target = '0'.repeat(difficulty)
  let nonce = 0
  let hash = ''
  
  do {
    const input = `${data}:${nonce}`
    hash = CryptoJS.SHA256(input).toString()
    nonce++
  } while (!hash.startsWith(target) && nonce < 1000000) // Prevent infinite loop
  
  return { hash, nonce: nonce - 1 }
}

/**
 * Verify proof-of-work
 * @param data Original data
 * @param nonce Nonce value
 * @param difficulty Required difficulty
 * @returns Whether the proof-of-work is valid
 */
export function verifyProofOfWork(data: string, nonce: number, difficulty: number): boolean {
  const input = `${data}:${nonce}`
  const hash = CryptoJS.SHA256(input).toString()
  const target = '0'.repeat(difficulty)
  return hash.startsWith(target)
}

/**
 * Encrypt data using AES
 * @param data Data to encrypt
 * @param password Password/key
 * @returns Encrypted data as string
 */
export function encryptData(data: string, password: string): string {
  return CryptoJS.AES.encrypt(data, password).toString()
}

/**
 * Decrypt data using AES
 * @param encryptedData Encrypted data string
 * @param password Password/key
 * @returns Decrypted data or null if failed
 */
export function decryptData(encryptedData: string, password: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    return null
  }
}

/**
 * Generate a deterministic key from a seed
 * @param seed Seed string
 * @param salt Optional salt
 * @returns Derived key as hex string
 */
export function deriveKey(seed: string, salt: string = ''): string {
  return CryptoJS.PBKDF2(seed, salt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString()
}