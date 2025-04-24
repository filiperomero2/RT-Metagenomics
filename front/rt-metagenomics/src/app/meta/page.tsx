'use client';

import { useState } from 'react';
import styles from './meta.module.css';

export default function Meta() {
  const [formData, setFormData] = useState({
    dataType: '',
    sampleSheet: '',
    configFile: '',
    output: '',
    runName: '',
    trim: 0,
    createConfigOnly: false,
    threads: 1,
    threadsTotal: 1,
    kraken2Database: '',
    kronaDatabase: '',
    removeHumanReads: false,
    removeUnclassifiedReads: false,
    adapters: '',
    minimumReadLength: 50,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // Handle form submission logic here
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Meta Page</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Data Type:
          <select name="dataType" value={formData.dataType} onChange={handleChange} className={styles.input}>
            <option value="">Select</option>
            <option value="illumina">Illumina</option>
            <option value="nanopore">Nanopore</option>
          </select>
        </label>
        <label className={styles.label}>
          Sample Sheet:
          <input type="text" name="sampleSheet" value={formData.sampleSheet} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Config File:
          <input type="text" name="configFile" value={formData.configFile} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Output Directory:
          <input type="text" name="output" value={formData.output} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Run Name:
          <input type="text" name="runName" value={formData.runName} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Trim:
          <input type="number" name="trim" value={formData.trim} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Create Config Only:
          <input type="checkbox" name="createConfigOnly" checked={formData.createConfigOnly} onChange={handleChange} className={styles.checkbox} />
        </label>
        <label className={styles.label}>
          Threads:
          <input type="number" name="threads" value={formData.threads} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Threads Total:
          <input type="number" name="threadsTotal" value={formData.threadsTotal} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Kraken2 Database:
          <input type="text" name="kraken2Database" value={formData.kraken2Database} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Krona Database:
          <input type="text" name="kronaDatabase" value={formData.kronaDatabase} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Remove Human Reads:
          <input type="checkbox" name="removeHumanReads" checked={formData.removeHumanReads} onChange={handleChange} className={styles.checkbox} />
        </label>
        <label className={styles.label}>
          Remove Unclassified Reads:
          <input type="checkbox" name="removeUnclassifiedReads" checked={formData.removeUnclassifiedReads} onChange={handleChange} className={styles.checkbox} />
        </label>
        <label className={styles.label}>
          Adapters:
          <input type="text" name="adapters" value={formData.adapters} onChange={handleChange} className={styles.input} />
        </label>
        <label className={styles.label}>
          Minimum Read Length:
          <input type="number" name="minimumReadLength" value={formData.minimumReadLength} onChange={handleChange} className={styles.input} />
        </label>
        <button type="submit" className={styles.button}>Submit</button>
      </form>
    </div>
  );
}