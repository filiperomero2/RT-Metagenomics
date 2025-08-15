FROM continuumio/miniconda3:25.1.1-2
LABEL version="1.0.3" \
      description="Docker image for RT-Metagenomics"

RUN apt-get update
WORKDIR /app

COPY back /app/back/
COPY front /app/front/

# Install the environment
RUN conda create -n rt-meta python=3.11
ENV PATH=/opt/conda/envs/rt-meta/bin:$PATH

RUN conda env update -n rt-meta --file back/environment.yml && conda clean -a -y
RUN conda env update -n rt-meta --file back/app/viralunity/environment.yml && conda clean -a -y
#RUN conda env create --quiet -f back/environment.yml && conda clean -a -y
#RUN conda env create --quiet -f back/app/viralunity/environment.yml && conda clean -a -y

#ENV PATH=/opt/conda/envs/viralunity/bin:$PATH

RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs
RUN npm i -g pnpm

WORKDIR /app/front/
RUN pnpm install
#RUN pnpm run build

WORKDIR /app/back/
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

WORKDIR /

CMD ["/bin/bash", "/app/run.sh"]
